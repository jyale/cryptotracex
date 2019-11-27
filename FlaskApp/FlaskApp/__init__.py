from flask import Flask
import urllib, urllib2, json, math, logging, csv
from flask import request, redirect
from flask_cors import CORS
from time import sleep
from sets import Set

app = Flask(__name__) # set up the flask app
CORS(app) # allow cross origin

# variables used by both api endpoints for hitting the eth api
startblock = '0000000' # how far back in time to go
endblock = '99999999'
apikey = 'AYTFD4V2BA7BERMC15NQ1GBAVG1Q2IGJAX'
user_agent = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64)'
values = {'name': 'Hello',
          'location': 'New York',
          'language': 'Python' }
headers = {'User-Agent': user_agent}


# api to convert a wallet address into it's label (e.g. exchange name)
@app.route("/getlabel")
def getlabel():
	# get the wallet address
	address = request.args.get('address')
	address = address.lower() # convert to lower case
	# get the dict mapping addresses to labels
	# labels - todo need to do outside this method to be faster? - update: seems pretty fast to me atm
	with open('/var/www/cryptotracex/FlaskApp/FlaskApp/labels4.csv', mode='r') as infile:
		reader = csv.reader(infile)
		labels = dict((rows[0],rows[1]) for rows in reader)
	# determine whether we have a label or not
	haslabel = False
	label = address
	if address in labels:
		label = labels[address]
		haslabel = True # we have a label so set this to true

	data = '{"haslabel": ' + str(haslabel).lower() + ', "address": "' + address + '", "label": "' + label + '"}'

	# format the json response and send back
	response = app.response_class(
		response=data,
		status=200,
		mimetype='application/json'
	)
	return response



# api for new website using react
@app.route("/graphapi")
def graphapi():
	addresses = request.args.getlist('address')

	nodes = set() # the nodes
	edges = []

	maxval = 0.0

	# labels - todo need to do outside this method to be faster? - update: seems pretty fast to me atm
	with open('/var/www/cryptotracex/FlaskApp/FlaskApp/labels4.csv', mode='r') as infile:
		reader = csv.reader(infile)
		labels = dict((rows[0],rows[1]) for rows in reader)
	with open('/var/www/cryptotracex/FlaskApp/FlaskApp/labels4.csv', mode='r') as infile:
		reader = csv.reader(infile)
		labelsback = dict((rows[1],rows[0]) for rows in reader)

	for i in range(len(addresses)):
		address = addresses[i]
		print("Got address: " + address)

		# map labels back to hex addresses before sending to api
		if len(address) != 42:
			address = labelsback[address]

		address = address.lower() # convert to lower case

		print "Sending address: " + address

		# sample URL for in browser testing
		# http://api.etherscan.io/api?page=0&offset=10&module=account&action=txlist&address=0x4EAF87bc71ccf9Dec5059994852409Ffd51ee786&startblock=8000000&endblock=99999999&sort=asc&apikey=AYTFD4V2BA7BERMC15NQ1GBAVG1Q2IGJAX

		url = 'http://api.etherscan.io/api?page=1&offset=300&module=account&action=txlist&address=' + address 
		url	+= '&startblock=' + startblock + '&endblock=' + endblock 
		url	+= '&sort=desc&apikey=' + apikey

		data = urllib.urlencode(values)
		req = urllib2.Request(url, data, headers)
		response = urllib2.urlopen(req)
		the_page = response.read()

		data = json.loads(the_page)

		for p in data['result']:
			val = float(p['value']) / 1000000000000000000
			if val != 0: # only show non zero transactions
				shortfrom = p['from']
				shortto = p['to']
				# replace hex address with a label if it is a miner or exchange etc
				if shortfrom in labels:
					shortfrom = labels[shortfrom]
				if shortto in labels:
					shortto = labels[shortto]

				nodes.add(shortfrom)
				nodes.add(shortto)
				edge = [shortfrom, shortto, val]
				edges.append(edge)
				if val > maxval:
					maxval = val
				if len(nodes) >= (i+1)*6:
					break

	addressList = []
	nodestring = '"nodes": ['
	for n in nodes:
		gotid = n
		# for exchanges / mining pools, convert back to the raw address for the labels
		if gotid in labelsback:
			gotid = labelsback[gotid]
		addressList.append(gotid)

	balanceDict = getBalancesFromAddressList(addressList)

	for n in nodes:
		color = '#C4DEF6'
		if n[0] != "0":
			color = '#8b0000'
		gotid = n
		# for exchanges / mining pools, convert back to the raw address for the labels
		if gotid in labelsback:
			gotid = labelsback[gotid]

		# # now let's request the balance for each wallet
		# url = 'https://api.etherscan.io/api?module=account&action=balance&tag=latest&address=' + gotid 
		# url	+= '&apikey=' + apikey

		# print "Getting balance for URL: " + url
		# data = urllib.urlencode(values)
		# req = urllib2.Request(url, data, headers)
		# response = urllib2.urlopen(req)
		# sleep(0.1)
		# the_page = response.read()
		# data = json.loads(the_page)

		# end of requesting balance for wallet

		nodestring += '{ "id": "' + gotid + '", "title": "' + n + '", "color": "' + color + '", "label": "' + str(balanceDict[gotid]) + ' ETH"},'
	
	nodestring = nodestring[:-1] # strip off comma from last line
	nodestring += '],'

	edgestring = '"edges": ['
	for l in edges:
		# color = '#8b0000'
		# if l[1] == address:
		# 	color = '#013220'
		
		gotidfrom = l[0]
		# for exchanges / mining pools, convert back to the raw address for the labels
		if gotidfrom in labelsback:
			gotidfrom = labelsback[gotidfrom]
		gotidto = l[1]
		# for exchanges / mining pools, convert back to the raw address for the labels
		if gotidto in labelsback:
			gotidto = labelsback[gotidto]			


		normalizedVal = l[2]/maxval*10
		# TODO - remove underscore from value to get different sized edges (weighted)
		edgestring += '{"from": "' +  gotidfrom + '", "to": "' + gotidto + '", "color": "", "_value": "' + str(normalizedVal) + '", "title": "' + str(l[2]) + ' ETH"' + '},'
	edgestring = edgestring[:-1]
	edgestring += ']'

	total = '{' + nodestring + edgestring + "}"
	data = total

	# data='{"nodes": ["0xcc493af8cd0c917f61241073d6f227143a39452a","0xb160ea5baf58be753d0399bcab87eb5c1b641787","0xb2f4cd430c42d2963f04c90b6d38b23536cb1e77","0x58319b1b568f540281aea0eab40de7371604b737","0xf9242995618b979763ff03cb5b79fb572455ea92","0x61cded075fc76f3044f3445aa349686d1c2876f0","0x2d1d3a1703b1229bfa283769f20db19596b2105e","0x43fe3b270d8963f0380b42a1a6d75863dc670e3e","0x441a9158504498515ada1cd1808bc3d25053d990","0xda017819eb73b5eeff2bf653f3fef01294555252","0x3540f3486f38addef7c671298c4fd484f018b6be","0x7a70163cd5d9ac96602c68b6f8101d7e62b76f6e","0xb4015ae51faff98153c1296df1ac0cb45f95b41a","0xaf9c8f0b018a008811f7ca1e0112ce2ae5f51b79","0x490863f83e0331afd584e4785a1838dbf474180a","0x03cf09db807c9b2a622630ae05cd087683b42f03","0x5f79d689e134ec301b5ae8267cb91e443a7f90d9","0x1e8b0bcd01e885b3309fab57bd0df4db31c28a36","0x5bb304d8a6bde7e91c8e21734e53ab74420874a0","0x8957cfe4bc5bf403fc228849910d15d1546c73e3","0x6d6dd93a9d4b202893f77ab24130c2549bde08d1","0xabf633d06e4393bf35caeac0bd4e2948fc91df1c","0x5cbcefc99a7e3ecf6e2732191518142362dd6e07"],"edges": [["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x61cded075fc76f3044f3445aa349686d1c2876f0",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x5f79d689e134ec301b5ae8267cb91e443a7f90d9",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x490863f83e0331afd584e4785a1838dbf474180a",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x3540f3486f38addef7c671298c4fd484f018b6be",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x3540f3486f38addef7c671298c4fd484f018b6be",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x1e8b0bcd01e885b3309fab57bd0df4db31c28a36",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x03cf09db807c9b2a622630ae05cd087683b42f03",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x5bb304d8a6bde7e91c8e21734e53ab74420874a0",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x5f79d689e134ec301b5ae8267cb91e443a7f90d9",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xb2f4cd430c42d2963f04c90b6d38b23536cb1e77",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xb160ea5baf58be753d0399bcab87eb5c1b641787",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x6d6dd93a9d4b202893f77ab24130c2549bde08d1",{"color": "#ff0000"}],["0x5cbcefc99a7e3ecf6e2732191518142362dd6e07", "0x43fe3b270d8963f0380b42a1a6d75863dc670e3e",{"color": "#00ff00"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xda017819eb73b5eeff2bf653f3fef01294555252",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xaf9c8f0b018a008811f7ca1e0112ce2ae5f51b79",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x441a9158504498515ada1cd1808bc3d25053d990",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x8957cfe4bc5bf403fc228849910d15d1546c73e3",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xb4015ae51faff98153c1296df1ac0cb45f95b41a",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x441a9158504498515ada1cd1808bc3d25053d990",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xabf633d06e4393bf35caeac0bd4e2948fc91df1c",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x58319b1b568f540281aea0eab40de7371604b737",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xcc493af8cd0c917f61241073d6f227143a39452a",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xf9242995618b979763ff03cb5b79fb572455ea92",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x7a70163cd5d9ac96602c68b6f8101d7e62b76f6e",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x2d1d3a1703b1229bfa283769f20db19596b2105e",{"color": "#ff0000"}]]}'
	response = app.response_class(
		response=data,
		status=200,
		mimetype='application/json'
	)
	return response

# WARNING - only handles up to 20 addresses - do NOT submit more than 20 unique addresses (duplicates
# will be removed by the function)
# TODO - batch into groups of 20 and send to api
def getBalancesFromAddressList(addressList):	
	# create the URL
	url = 'https://api.etherscan.io/api?module=account&action=balancemulti&tag=latest&apikey=' + apikey + '&address='

	# convert list to set to remove duplicates
	addressSet = Set()
	for address in addressList:
		address = address.lower() # convert to lower case
		addressSet.add(address)
	# convert from set back to list - now have list with no duplicates
	addressList = list(addressSet)

	print "length of addressList: " + str(len(addressList))
	if len(addressList) > 20:
		print "WARNING: should NOT submit more than 20 addresses, number submitted was: " + str(len(addressList))

	for address in addressList:
		url += address + ','
	url = url[:-1] # remove final trailing comma
	print "requesting URL: " + url

	# now make the request 
	data = urllib.urlencode(values)
	req = urllib2.Request(url, data, headers)
	sleep(0.1) # sleep so do not overload API server - todo is this necessary?
	response = urllib2.urlopen(req)
	the_page = response.read()
	data = json.loads(the_page) 	# parse the json

	# make a dict mapping addresses to balances
	balanceDict = dict() # map from wallets to balances
	for pair in data['result']:
		balanceDict[str(pair['account'])] = float(pair['balance'])/1000000000000000000
	return balanceDict	# return the dict


# api for new website using react
@app.route("/listapi")
def listapi():
	addresses = request.args.getlist('address')
	page = request.args.get('page')

	edges = []
	maxval = 0.0

	# labels - todo need to do outside this method to be faster?
	with open('/var/www/cryptotracex/FlaskApp/FlaskApp/labels4.csv', mode='r') as infile:
		reader = csv.reader(infile)
		labels = dict((rows[0],rows[1]) for rows in reader)
	with open('/var/www/cryptotracex/FlaskApp/FlaskApp/labels4.csv', mode='r') as infile:
		reader = csv.reader(infile)
		labelsback = dict((rows[1],rows[0]) for rows in reader)

	print "labelsback length: " + str(len(labelsback))

	for i in range(len(addresses)):
		address = addresses[i]
		print("Got address: " + address)

		# map labels back to hex addresses before sending to api
		if len(address) != 42:
			address = labelsback[address]

		address = address.lower() # convert to lower case
		url = 'http://api.etherscan.io/api?page=' + page + '&offset=10&module=account&action=txlist&address=' + address 
		url	+= '&startblock=' + startblock + '&endblock=' + endblock 
		url	+= '&sort=desc&apikey=' + apikey

		print "requesting transaction url: " +  url

		data = urllib.urlencode(values)
		req = urllib2.Request(url, data, headers)
		sleep(0.1) # sleep so do not overload API server
		response = urllib2.urlopen(req)
		the_page = response.read()

		data = json.loads(the_page)

		for p in data['result']:
			val = float(p['value']) / 1000000000000000000
			# if val != 0: # only show non zero transactions
			shortfrom = p['from']
			shortto = p['to']

			edge = [shortfrom, shortto, val]
			edges.append(edge)
			if val > maxval:
				maxval = val
			if len(edges) >= (i+1)*10:
				break

	edgestring = '['
	id = 0

	# done - now have helper function that takes list of addresses and returns a dict

	# make a list of all the addresses (set?)
	addressList = []
	for l in edges:
		addressList.append(l[0])
		addressList.append(l[1])

	# get the balances
	balanceDict = getBalancesFromAddressList(addressList) 	# now we have a hashmap of addresses to balances

	for l in edges:
		color = '#8b0000'
		if l[1] == address:
			color = '#013220'
		normalizedVal = l[2]/maxval*10
		edgestring += '{"id": "' + str(id) +  '", "from": "' +  l[0] + '", "to": "'
		edgestring += l[1] + '", "amount": "' + str(l[2]) + ' ETH", ' 

		# done - get the balances using the other method
		fromBal = str(balanceDict[l[0]])
		toBal = str(balanceDict[l[1]])

		# add balances to the response
		edgestring += '"fromBalance":"' + fromBal + '", '
		edgestring += '"toBalance":"' + toBal + '", '		

		# now add the labels if any
		fromLabel = l[0]
		toLabel = l[1]
		if fromLabel in labels:
			fromLabel = labels[fromLabel]
		if toLabel in labels:
			toLabel = labels[toLabel]			

		edgestring += '"fromLabel":"' + fromLabel + '", '
		edgestring += '"toLabel":"' + toLabel + '" '		

		edgestring += '},'

		# add from balance and to balance 
		id = id + 1

	edgestring = edgestring[:-1]
	edgestring += ']'

	total = edgestring
	data = total

	# data='{"nodes": ["0xcc493af8cd0c917f61241073d6f227143a39452a","0xb160ea5baf58be753d0399bcab87eb5c1b641787","0xb2f4cd430c42d2963f04c90b6d38b23536cb1e77","0x58319b1b568f540281aea0eab40de7371604b737","0xf9242995618b979763ff03cb5b79fb572455ea92","0x61cded075fc76f3044f3445aa349686d1c2876f0","0x2d1d3a1703b1229bfa283769f20db19596b2105e","0x43fe3b270d8963f0380b42a1a6d75863dc670e3e","0x441a9158504498515ada1cd1808bc3d25053d990","0xda017819eb73b5eeff2bf653f3fef01294555252","0x3540f3486f38addef7c671298c4fd484f018b6be","0x7a70163cd5d9ac96602c68b6f8101d7e62b76f6e","0xb4015ae51faff98153c1296df1ac0cb45f95b41a","0xaf9c8f0b018a008811f7ca1e0112ce2ae5f51b79","0x490863f83e0331afd584e4785a1838dbf474180a","0x03cf09db807c9b2a622630ae05cd087683b42f03","0x5f79d689e134ec301b5ae8267cb91e443a7f90d9","0x1e8b0bcd01e885b3309fab57bd0df4db31c28a36","0x5bb304d8a6bde7e91c8e21734e53ab74420874a0","0x8957cfe4bc5bf403fc228849910d15d1546c73e3","0x6d6dd93a9d4b202893f77ab24130c2549bde08d1","0xabf633d06e4393bf35caeac0bd4e2948fc91df1c","0x5cbcefc99a7e3ecf6e2732191518142362dd6e07"],"edges": [["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x61cded075fc76f3044f3445aa349686d1c2876f0",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x5f79d689e134ec301b5ae8267cb91e443a7f90d9",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x490863f83e0331afd584e4785a1838dbf474180a",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x3540f3486f38addef7c671298c4fd484f018b6be",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x3540f3486f38addef7c671298c4fd484f018b6be",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x1e8b0bcd01e885b3309fab57bd0df4db31c28a36",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x03cf09db807c9b2a622630ae05cd087683b42f03",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x5bb304d8a6bde7e91c8e21734e53ab74420874a0",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x5f79d689e134ec301b5ae8267cb91e443a7f90d9",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xb2f4cd430c42d2963f04c90b6d38b23536cb1e77",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xb160ea5baf58be753d0399bcab87eb5c1b641787",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x6d6dd93a9d4b202893f77ab24130c2549bde08d1",{"color": "#ff0000"}],["0x5cbcefc99a7e3ecf6e2732191518142362dd6e07", "0x43fe3b270d8963f0380b42a1a6d75863dc670e3e",{"color": "#00ff00"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xda017819eb73b5eeff2bf653f3fef01294555252",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xaf9c8f0b018a008811f7ca1e0112ce2ae5f51b79",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x441a9158504498515ada1cd1808bc3d25053d990",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x8957cfe4bc5bf403fc228849910d15d1546c73e3",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xb4015ae51faff98153c1296df1ac0cb45f95b41a",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x441a9158504498515ada1cd1808bc3d25053d990",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xabf633d06e4393bf35caeac0bd4e2948fc91df1c",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x58319b1b568f540281aea0eab40de7371604b737",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xcc493af8cd0c917f61241073d6f227143a39452a",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0xf9242995618b979763ff03cb5b79fb572455ea92",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x7a70163cd5d9ac96602c68b6f8101d7e62b76f6e",{"color": "#ff0000"}],["0x43fe3b270d8963f0380b42a1a6d75863dc670e3e", "0x2d1d3a1703b1229bfa283769f20db19596b2105e",{"color": "#ff0000"}]]}'
	response = app.response_class(
		response=data,
		status=200,
		mimetype='application/json'
	)
	return response




if __name__ == "__main__":
	logging.basicConfig(filename='error.log',level=logging.DEBUG)
	app.run()

