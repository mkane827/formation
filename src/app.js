import 'angular-ui-router/release/stateEvents';
import 'angular-mocks';
import angular from 'angular';
import ngAnimate from 'angular-animate';
import uiRouter from 'angular-ui-router';
import Formation from '@darkobits/formation';


const app = angular.module('App', [
  'ngMockE2E',
  'ui.router.state.events',
  Formation,
  ngAnimate,
  uiRouter
]);


// Set API delay.
app.constant('API_DELAY', 1000);


// Set Formation component prefix.
app.config(FormationProvider => {
  FormationProvider.showErrorsOn('touched, submitted');
});


export default app;
