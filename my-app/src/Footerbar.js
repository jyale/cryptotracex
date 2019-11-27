import React, { Component } from "react";
import {
  Container, Row, Col
 } from 'reactstrap';

class Footerbar extends Component {
  render(){
    return (
      <Container>      
      <Row>
        <Col>
              <p></p>
              <p>
              <small>
              Disclaimer: THIS WEBSITE IS PROVIDED WITH ABSOLUTELY NO WARRANTY OF ANY KIND WHATSOEVER. USE AT YOUR OWN RISK.
              You must be over the age of 18 to use this website. This website is a work in progress so may change from time to time without notice. 
              Nothing on this website constitutes financial, legal, investment or any other type of advice. 
              This website is provided for educational and entertainment purposes only.
              Copyright 2019 John Maheswaran.           
              </small>   
              </p>
              </Col>
      </Row>
      </Container>
            )
  }

}

export default Footerbar