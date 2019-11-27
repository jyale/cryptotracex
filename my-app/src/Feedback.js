import React from 'react';
import Headerbar from './Headerbar'
import Footerbar from './Footerbar'

import {
  Container, Row, Col
 } from 'reactstrap';
 
const Feedback = () => {
    return (
    	       <div>

    	<Headerbar />

      <Container>      
      <Row>
        <Col xs="3"></Col>
        <Col>
        <div className="card-body">
              <h3 className="card-title">Feedback</h3>
              <p>
             
              WEAK Feedback

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
 
export default Feedback;