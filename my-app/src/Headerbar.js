import React, { Component } from "react";
import {
  Navbar,
  NavbarBrand
 } from 'reactstrap';



class Headerbar extends Component {
  render(){
    return (
      <div>
      <Navbar color="light" light expand="md">
        <NavbarBrand href="http://www.cryptotracex.com">Home</NavbarBrand>        
        <NavbarBrand href="about">About</NavbarBrand>                
        <NavbarBrand href="consultations">Consultations</NavbarBrand>        


      </Navbar>
      <p></p>
      </div>
      )
  }

}

export default Headerbar;