import React, { Component } from "react";
import Graph from "react-graph-vis";
import Headerbar from "./Headerbar";
import Footerbar from "./Footerbar";

import update from 'react-addons-update';

import PacmanLoader from 'react-spinners/PacmanLoader';
import { css } from '@emotion/core';
import { Button } from 'reactstrap';

import {
  Container, Row, Col
 } from 'reactstrap';

import "bootstrap/dist/css/bootstrap.css";

const override = css`
    display: block;
    margin: 0 auto;
    border-color: red;
`;

class ForceGraph extends Component {

  constructor() {
    super();

    // bind functions to this context
    this.addEdgeToGraph = this.addEdgeToGraph.bind(this)
    this.handleNodeClick = this.handleNodeClick.bind(this)
    this.fetchTransactionList = this.fetchTransactionList.bind(this)
    this.fetchGraphData = this.fetchGraphData.bind(this)
    this.toggleLabels = this.toggleLabels.bind(this)
    this.truncate = this.truncate.bind(this)
    this.graphContainsEdge = this.graphContainsEdge.bind(this) // method to check if an edge exists in our graph
    this.removeEdgeFromGraph = this.removeEdgeFromGraph.bind(this) // remove an edge from the graph
    this.nextPage = this.nextPage.bind(this) // next page in pagination
    this.prevPage = this.prevPage.bind(this) // next page in pagination
    this.hasPrev = this.hasPrev.bind(this) // next page in pagination
    this.getDisablePrevNext = this.getDisablePrevNext.bind(this) // used to disable next/prev buttons while loading

    this.state = {
      loading: true,
      btn_disabled:false,
      wallet: "0x9e228c2dc2a11f4979d157336681e4a57c84d4bd", // the currently selected node / wallet address
      walletlabel: "0x9e228c2dc2a11f4979d157336681e4a57c84d4bd", // label eg for exchanges etc otherwise the wallet address
      page: 1, // the offset for the current page for pagination

      disablePrevNext: true, // used to disable the prev/next buttons while we are fetching the next page so user can't repeatedly click it

      todos: [],

      options: {
        layout: {
          // hierarchical: true,
        },        
        edges: {
          color: "#000000",
          smooth: true
        },
        nodes: {
          color: "#C4DEF6",
          shape: "dot",
          size: 15,
          font:{
            align:"center",
            size:0
          },
        },
        physics: {
          enabled: true
        },
        interaction: { multiselect: true, dragView: true }
      },
      graph: {
        nodes: [
        {/* 
          { id: "1", label: "1", color:"#8b0000" },
          { id: "2", label: "2" },
          { id: "3", label: "3" },
          { id: "4", label: "4" },
          { id: "5", label: "5" }
        */}
        ],
        edges: [
          {/* 
          { from: "1", to: "2" },
          { from: "1", to: "3" },
          { from: "2", to: "4" },
          { from: "2", to: "5" }
          */}
        ]
      },
      events: {
          // select: handleNodeClick(event)
          // function(event) {
          //     var { nodes, edges } = event;
          //     this.handleNodeClick(nodes);
          // }

          select: (event) => {
            var { nodes, _ } = event; // underscore represents edges
            this.handleNodeClick(nodes);
          }
      }
    };
  }

  handleNodeClick(nodes){
    console.log("selected node: " + nodes[0]);

    var walletlabel;
    for (var index = 0; index < this.state.graph.nodes.length; index++) { 
      if(this.state.graph.nodes[index].id === nodes[0]){
        walletlabel = this.state.graph.nodes[index].title;
      }
    } 

    this.setState({
      wallet: nodes[0],
      walletlabel: walletlabel
    });    
  }

  // a function that checks if an edge exists in our graph
  // bind to this to get access to edges list
  graphContainsEdge(from, to, amount){
    // will return true if we find the edge in the graph, otherwise false
    // now iterate over the edges in the graph
    for (var index = 0; index < this.state.graph.edges.length; index++) { 
      // console.log("this.state.graph.edges[index].from: " + this.state.graph.edges[index].from);
      // console.log("this.state.graph.edges[index].title: " + this.state.graph.edges[index].title + "amount: " + amount)
      if(this.state.graph.edges[index].from === from && this.state.graph.edges[index].to === to && this.state.graph.edges[index].title === amount){
        return true;
      }
    }
    return false;
  }

  // function to remove an edge from the graph
  removeEdgeFromGraph(from, to, amount){
    // check if the graph contains edge, if not then log this
    if(!this.graphContainsEdge(from, to, amount)){
      console.log("Graph does not contain edge");
    }

    // now we know that the graph contains the edge so let's find it in the list of edges
    // make a new edgelist not including the edge that we want to remove

    // then set the graph state to the new edgelist

    this.setState(state => {

      var edgelist = [];
      var nodelist = [];

      // iterate over edges list and add every list OTHER than the one we are removing to our new list
      for (var index = 0; index < this.state.graph.edges.length; index++) { 
        // check that it is not the edge we are removing
        if(!(this.state.graph.edges[index].from === from && this.state.graph.edges[index].to === to && this.state.graph.edges[index].title === amount)){
          edgelist = edgelist.concat(this.state.graph.edges[index]); // add the edge to our list
        }      
      }

      // now go through the nodes list and add them ONLY if they are in the edge list
      for (var i = 0; i < this.state.graph.nodes.length; i++) { 
        var needNode = false;
        var node = this.state.graph.nodes[i];
        for (var j = 0; j < edgelist.length; j++) { 
            if(edgelist[j].from === node.id || edgelist[j].to === node.id){
              needNode = true;
            }            
        }
        if(needNode){
          nodelist = nodelist.concat(node);
        }

      }

      // update the edges list
      console.log("got edgelist: " + edgelist); // log the edgelist
      var graph = update(this.state.graph, {nodes: {$set: nodelist}, edges: {$set: edgelist}})

      return {        
        graph
      };
    });



  }

  // function to add an edge to the graph
  addEdgeToGraph(from, to, amount, fromBalance, toBalance, fromLabel, toLabel){
      // this.setState({ 
      //   btn_disabled: true
      // });
      // update the nodes and edges in the graph
    this.setState(state => {
      // update the node list
      var alreadyContainsFrom = state.graph.nodes.some(el => {
        if(el.id === from){
          return true;
        } else {
          return false;
        }
      });

      // See if we already have the "from" node in the graph, so that we only add it if it is not already there
      var list = state.graph.nodes;

      // DONE - color should in line with exchanges/mining/regular nodes - miners/exchanges are red, regular nodes are blue

      if(!alreadyContainsFrom){
        // change the color if the label is different from the id - ie an exchange or mining pool
        console.log("from: " + from + " fromLabel: " + fromLabel);

        if(from === fromLabel){
          list = state.graph.nodes.concat({ id: from, title: fromLabel, color: "#C4DEF6", label:fromBalance + " ETH"});
        } else {
          list = state.graph.nodes.concat({ id: from, title: fromLabel, color: "#8b0000", label:fromBalance + " ETH"});
        }
      } 

      // Now handle the "to" node - check that it is not already in the graph
      var alreadyContainsTo = state.graph.nodes.some(el => {
        if(el.id === to){
          return true;
        } else {
          return false;
        }
      });

      if(!alreadyContainsTo){
          // change the color if the label is different from the id - ie an exchange or mining pool        
          console.log("to: " + to + " toLabel: " + toLabel);
          if(to === toLabel){
              list = list.concat({ id: to, title: toLabel, color: "#C4DEF6", label:toBalance + " ETH" });
          } else {
              list = list.concat({ id: to, title: toLabel, color: "#8b0000", label:toBalance + " ETH" });
          }
      } 

      // done - check edge list before adding
      var edgelist = state.graph.edges;
      var alreadyContainsEdge = state.graph.edges.some(el => {
        if(el.from === from && el.to === to && el.title === amount){
          return true;
        } else {
          return false;
        }
      });

      if(!alreadyContainsEdge){
          edgelist = state.graph.edges.concat({ from: from, to: to, title: amount });
      }

      // update the edges list
      console.log(edgelist)
      var graph = update(this.state.graph, {nodes: {$set: list}, edges: {$set: edgelist}})

      return {        
        graph
      };
    });
  }

  fetchTransactionList(address){
    console.log("fetching with page: " + this.state.page);

    // disable prev/next buttons

    fetch('http://api.cryptotracex.com/listapi?address=' + address + '&page=' + this.state.page, {mode:"cors"})
    .then(res => res.json())
    .then((data) => {
      this.setState({ todos: data, 
            loading: false,
            // re-enable prev/next buttons
            // disablePrevNext: false

         })
      console.log("fetched page: " + this.state.page);
    })
    .catch(console.log)
  }

  // next page of transactions (older transactions)
  nextPage(){
    this.setState({
        page: this.state.page + 1,
        // disablePrevNext: true
    }, () => {
        this.fetchTransactionList(this.state.wallet);
    });
  }

  // prev page of transactions (newer)
  prevPage(){
    this.setState({
        page: this.state.page - 1,
        // disablePrevNext: true
    }, () => {
        this.fetchTransactionList(this.state.wallet);
    });
  }

  getDisablePrevNext(){
    return this.disablePrevNext;
  }

  // function to return true iff there are previous pages of transactions
  hasPrev(){
    return this.state.page <= 1;
  }    

  fetchGraphData(address){
    fetch('http://api.cryptotracex.com/graphapi?address=' + address, {mode:"cors"})
    .then(res => res.json())
    .then((data) => {
      this.setState({ graph: data })
      console.log(data)
    })
    .catch(console.log)
  }

  // trunctate long addresses / strings
  truncate(str) {
      return str.length > 20 ? str.substring(0, 17) + "..." : str;
  }

  // toggle account balance labels
  toggleLabels(){
    if(this.state.options.nodes.font.size === 0){
        this.setState({
            options: {nodes: {font:{ size: 15}}}
        })
    } else {
        this.setState({
            options: {nodes: {font:{ size: 0}}}
        })
    }
  }

  componentDidMount() {
    document.addEventListener("mousedown", e => {});
    document.addEventListener("mousemove", e => {});

    var address=this.state.wallet;
    this.fetchTransactionList(address); // get the transactions for rhs list
    this.fetchGraphData(address); // get the data for the nodes and edges on lhs graph

    // fetch('http://api.cryptotracex.com/newapi?address=0x4EAF87bc71ccf9Dec5059994852409Ffd51ee786&address=0x9e228c2dc2a11f4979d157336681e4a57c84d4bd', {mode:"cors"})

  }

  events = {
    dragStart: event => {},
    dragEnd: event => {}
  };

  render() {
    return (
    <div>

    <Headerbar />
      <Container>
      
          <Loadingbar loading={this.state.loading} 
            graph={this.state.graph} 
            options={this.state.options} 
            events={this.state.events}
            todos={this.state.todos}
            addEdgeToGraph={this.addEdgeToGraph} 
            btn_disabled={this.state.btn_disabled}
            wallet={this.state.wallet}
            walletlabel={this.state.walletlabel}
            fetchTransactionList={this.fetchTransactionList}
            toggleLabels={this.toggleLabels}
            truncate={this.truncate}
            graphContainsEdge={this.graphContainsEdge}
            removeEdgeFromGraph={this.removeEdgeFromGraph}
            nextPage={this.nextPage}
            prevPage={this.prevPage}
            hasPrev={this.hasPrev}
            getDisablePrevNext={this.getDisablePrevNext}

            />

      </Container>
      <Footerbar />
       </div>
    );
  }
}

function Loadingbar(props) {
  if (props.loading) {
    return (
      <div>
          <Row>
      <Col>
      <br /><br /><br />
      <br /><br /><br />
        <div className='sweet-loading'>
                <PacmanLoader
                  css={override}
                  sizeUnit={"px"}
                  size={25}
                  color={'#C4DEF6'}
                  loading={props.loading}
                />
              </div> 
              <br /><br /><br />
              <br /><br /><br />
              </Col>    </Row>
      </div>
              )
  }

  return (
    <div>
    <Row>
    <Col>
      <div id="graph" className="col-xs-8" style={{ height: "80vh" }}>
        <Graph
          graph={props.graph}
          options={props.options}
          events={props.events}
        />    
        </div>
        </Col>


    <Col>
    <div className="container">
        <div className="col-xs-12">
        <h6><b>Ether Transactions</b></h6>

          <div className="card border-success">
            <div className="card-body">
            <small>
                { typeof props.wallet !== "undefined"
                  ? props.wallet === props.walletlabel ? <div>Selected wallet: <b>{props.wallet}</b> <Button outline color="success" size="sm" onClick={() => props.fetchTransactionList(props.wallet)}>Show transactions</Button>
                   

                  </div>
                  : <div>Selected wallet: <b>{props.wallet}</b> <b>{props.walletlabel}</b> <Button outline color="success" size="sm" onClick={() => props.fetchTransactionList(props.wallet)}>Show transactions</Button>                   
                   </div>
                  : <div><b>No wallet selected</b>
                  </div>
                }
                
                <Button outline color="secondary" size="sm" onClick={() => props.toggleLabels()}>Toggle balances</Button>
                <Button outline color="secondary" size="sm" onClick={() => console.log("TODO - implement toggle node/edge sizes")}>Toggle node/edge sizes</Button>
                <br />

                  <div>
                <Button outline color="primary" size="sm" disabled={props.hasPrev()} onClick={() => props.prevPage()}>Prev</Button>
                <Button outline color="primary" size="sm" disabled={props.getDisablePrevNext()} onClick={() => props.nextPage()}>Next</Button>
                </div>
                
                <div></div>

                
            </small>
          </div>
        </div>
             


            <Entrycard todos={props.todos}
                loading={props.loading} 
                graph={props.graph} 
                options={props.options} 
                events={props.events}
                addEdgeToGraph={props.addEdgeToGraph} 
                btn_disabled={props.btn_disabled}
                wallet={props.wallet}
                walletlabel={props.walletlabel}
                fetchTransactionList={props.fetchTransactionList}
                toggleLabels={props.toggleLabels}
                truncate={props.truncate}
                graphContainsEdge={props.graphContainsEdge}
                removeEdgeFromGraph={props.removeEdgeFromGraph}

              />


         

        </div>
       </div>
       </Col>
           </Row>
       </div>
      )
  };

// TODO - refactor this mess, use explicit if statements instead of the ternary ? :  operator, add comments, muliple "return" clauses for the different cases
function Entrycard(props){
  return(
    <div>
      {props.todos.map((todo) => (

            <div className="card" key={todo.id}>
            
            <div className="card-body">
            <small>
            { props.wallet == null || (todo.from !== props.wallet && todo.to !== props.wallet) ?
                <div>{props.truncate(todo.fromLabel)} → <b>{todo.amount}</b> → {props.truncate(todo.toLabel)}</div>
              :
              todo.from === props.wallet ? 
              <div><b>{props.truncate(todo.fromLabel)}</b> → <b>{todo.amount} <font color="#5bc0de">OUT</font></b> → {props.truncate(todo.toLabel)}</div>
              : todo.to === props.wallet ? <div>{props.truncate(todo.fromLabel)} → <b>{todo.amount} <font color="#f0ad4e">IN</font></b> → <b>{props.truncate(todo.toLabel)}</b></div>
              : <div>{props.truncate(todo.fromLabel)} → <b>{todo.amount}</b> → {props.truncate(todo.toLabel)}</div>              
              }

                { props.wallet == null || (todo.from !== props.wallet && todo.to !== props.wallet) ?
                  <Button outline color="secondary" size="sm" disabled={props.graphContainsEdge(todo.from, todo.to, todo.amount)} onClick={() => props.addEdgeToGraph(todo.from, todo.to, todo.amount, todo.fromBalance, todo.toBalance, todo.fromLabel, todo.toLabel)} 
                      >{props.graphContainsEdge(todo.from, todo.to, todo.amount) ? <div>Already added to graph</div> : <div>Add to graph</div>}</Button>
                  :
                  todo.from === props.wallet ? 
                  props.wallet != null ?
                  <Button outline color="info" size="sm" disabled={props.graphContainsEdge(todo.from, todo.to, todo.amount)} onClick={() => props.addEdgeToGraph(todo.from, todo.to, todo.amount, todo.fromBalance, todo.toBalance, todo.fromLabel, todo.toLabel)} 
                      >{props.graphContainsEdge(todo.from, todo.to, todo.amount) ? <div>Already added to graph</div> : <div>Add to graph</div>}</Button>
                      : <Button outline color="secondary" size="sm" disabled={props.graphContainsEdge(todo.from, todo.to, todo.amount)} onClick={() => props.addEdgeToGraph(todo.from, todo.to, todo.amount, todo.fromBalance, todo.toBalance, todo.fromLabel, todo.toLabel)} 
                      >{props.graphContainsEdge(todo.from, todo.to, todo.amount) ? <div>Already added to graph</div> : <div>Add to graph</div>}</Button>
                  :  props.wallet != null ?
                  <Button outline color="warning" size="sm" disabled={props.graphContainsEdge(todo.from, todo.to, todo.amount)} onClick={() => props.addEdgeToGraph(todo.from, todo.to, todo.amount, todo.fromBalance, todo.toBalance, todo.fromLabel, todo.toLabel)} 
                      >{props.graphContainsEdge(todo.from, todo.to, todo.amount) ? <div>Already added to graph</div> : <div>Add to graph</div>}</Button> 
                      :
                      <Button outline color="secondary" size="sm" disabled={props.graphContainsEdge(todo.from, todo.to, todo.amount)} onClick={() => props.addEdgeToGraph(todo.from, todo.to, todo.amount, todo.fromBalance, todo.toBalance, todo.fromLabel, todo.toLabel)} 
                      >{props.graphContainsEdge(todo.from, todo.to, todo.amount) ? <div>Already added to graph</div> : <div>Add to graph</div>}</Button> 
                    }

                <Button outline color="secondary" size="sm" disabled={!props.graphContainsEdge(todo.from, todo.to, todo.amount)} onClick={() => props.removeEdgeFromGraph(todo.from, todo.to, todo.amount)}>Remove from graph</Button>

              </small>
            </div>
          </div>


      ))}
    </div>

    )


}

export default ForceGraph;

