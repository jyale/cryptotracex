import React from 'react';
import Headerbar from './Headerbar'
import Footerbar from './Footerbar'

import {
  Container, Row, Col
 } from 'reactstrap';
 
const Consultations = () => {
    return (
    	       <div>

    	<Headerbar />

      <Container>      
      <Row>
              <Col xs="3"></Col>

        <Col>
        <div className="card-body">
              <h3 className="card-title">Consultations</h3>

              <p>
              If you are interested in subject matter expertise on  
              blockchain projects, crypto, digital assets, cryptography, computer science, software engineering, running a tech startup
               and so on, you can book a Skype consultation with me. Please use the calendar below to book your appointment - you will be redirected
               to PayPal for payment processing. Once you have made your appointment I will send you an email with Skype call details, or your preferred
               video conferencing software (e.g. Zoom/Google Hangouts/Blue Jeans etc).
              </p>

              <p>If you have any questions please <a href="https://www.linkedin.com/in/johnm6">connect with
               me on LinkedIn</a> and send me a messsage.
               </p>

		</div>
              </Col>
                      <Col xs="3"></Col>

      </Row>

      <Row>
      <Col>

              <p>
              <iframe src="https://app.acuityscheduling.com/schedule.php?owner=17085652" width="100%" height="800" frameBorder="0"></iframe><script src="https://embed.acuityscheduling.com/js/embed.js" type="text/javascript"></script>

              </p>

      </Col>
      </Row>
      </Container>

      <Footerbar />

       </div>
    );
}
 
export default Consultations;