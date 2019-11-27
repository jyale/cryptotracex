import React from 'react';
import Headerbar from './Headerbar'
import Footerbar from './Footerbar'

import {
  Container, Row, Col
 } from 'reactstrap';
 
const About = () => {
    return (
    	       <div>

    	<Headerbar />

      <Container>      
      <Row>
        <Col xs="3"></Col>
        <Col>
        <div className="card-body">
              <h3 className="card-title">About</h3>
              <p>
              CryptoTraceX is a tool used to track Ether transactions within the Ethereum network.
              It can be used to identify exchanges, mining pools, arbitrage wallets and other
               trading related transactions. 
               </p>
               <p>
               It can also be used to track spending and movement 
               of funds, identify address clusters and trace payments.
               </p>
               <p>
               This website was developed by <a href="https://www.linkedin.com/in/johnm6">Dr. John Maheswaran</a>. I have a PhD from Yale in Computer Science where I 
               focused on cryptography and distributed systems. I did my undergrad at Cambridge in Computer Science
               where I graduated with First Class Honors. I have worked on several enterprise blockchain projects including the <a href="https://adexchanger.com/data-exchanges/coming-2018-comcast-hopes-spur-data-sharing-blockchain-technology/">Comcast Blockchain 
               Insights Platform</a> (adtech) and <a href="https://www.forbes.com/sites/michaeldelcastillo/2018/08/14/goldman-sachs-and-jp-morgan-join-32m-series-b-in-enterprise-blockchain-startup-axoni/#737b5e446276">Axoni's AxCore EVM based trade tracking system</a> (fintech). 
               </p>
               <p>
               Please feel free 
               to <a href="https://www.linkedin.com/in/johnm6">connect with
               me on LinkedIn</a>.
               </p>
               <p>
               If you liked this website and you or your company are developing your own crypto
               or blockchain platform, you can <a href="consultations">sign up for a consultation</a> to discuss your
               project.
               </p>

		</div>
              </Col>
        <Col xs="3"></Col>
      </Row>
      </Container>

      <Footerbar />

       </div>
    );
}
 
export default About;