import React from 'react';
import Headerbar from './Headerbar'
import Footerbar from './Footerbar'

import {
  Container, Row, Col
 } from 'reactstrap';
 
const Showcase = () => {
    return (
    	       <div>

    	<Headerbar />

      <Container>      
      <Row>
        <Col xs="3"></Col>
        <Col>
        <div className="card-body">
              <h3 className="card-title">Showcase</h3>
              <p>
              *Showcase goes here*
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
 
export default Showcase;