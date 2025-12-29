import { Component } from '@angular/core';

@Component({
  selector: 'app-test-register',
  template: `
    <div style="padding: 20px; background: red; color: white; text-align: center;">
      <h1>REGISTER COMPONENT IS WORKING!</h1>
      <p>If you see this, the routing is working correctly.</p>
    </div>
  `
})
export class TestRegisterComponent {
  constructor() {
    console.log('TestRegisterComponent loaded successfully!');
  }
}