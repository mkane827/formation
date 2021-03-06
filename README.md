# formation

[![travis][travis-img]][travis-url] [![david][david-img]][david-url] [![codacy][codacy-img]][codacy-url] [![Code Style][xo-img]][xo-url] [![NPM Version][npm-img]][npm-url]

Formation is a form framework for Angular 1.5+. It aims to address many of the shortcomings in the built-in form facilities, and increase consistensy across large code bases by reducing the amount of boilterplace needed to build robust forms. It is inspired by the two leading paradigms for working with forms in Angular 2, [template-driven forms](http://toddmotto.com/angular-2-forms-template-driven) and [reactive forms](http://toddmotto.com/angular-2-forms-reactive), both of which have their own advantages and drawbacks.

Formation consists of several small components designed to be used as atoms (see: [atomic web design](http://bradfrost.com/blog/post/atomic-web-design/#atoms)) to compose larger elements. It is completely unopinionated about style, and ships with no CSS or themes.

## Setup

```bash
$ npm install @darkobits/formation
```

```js
import Formation from '@darkobits/formation';

angular.module('MyApp', [
  Formation
])
.config(FormationProvider => {
  // While optional, you should probably configure this behavior here to ensure
  // every form behaves consistently.
  FormationProvider.showErrorsOn('touched, submitted');
});
```

## Template-Driven vs. Reactive

Template-driven forms have been the longstanding paradigm in Angular 1.x. Structure, configuration, and validation of form controls is accomplished via markup and adding attributes to control elements for additional behavior (ex: `required`, or custom directives). This approach is straightforward, and allows newcomers to Angular to create simple-to-moderately complex forms quickly, but in large applications that require consistency and robust validation, working with a multitude of directives and managing model values, state, and errors for each control can quickly become burdensome.

With reactive forms, Angular 2 encourages developers to configure forms declaratively in code, requiring far less markup. However, the APIs can be cumbersome and rely too heavily on the relationships created between various class instances.

Formation attempts to strike a balance between both approaches: eliminate extraneous markup and give developers a way to configure controls from code with Plain Old JavaScript Objects. By moving configuration from the template to the controller, it promotes code re-use, consistency, and maintainability.

## Feature Overview

- Controls are configured using Plain Old JavaScript Objects at either the control level or the from level. Developers no longer need to spin-up new directives to provide custom behavior or validation to a control. Configuration definitions can be shared across the application, improving consistency. (See: [Control Configuration](/src/components/FormationControl#control-configuration))
- Developers no longer need to manage two sets of state with respect to controls and their models (ex: a form control at `vm.myForm.name` and its model value at `vm.name`). The form manages model values, which are determined by its registered controls. (See: [Working With Model Values](/src/components/Form#working-with-model-values))
- Submit handlers no longer need to check the `$valid` state of the form, wait for `$asyncValidators` to complete, or ensure that another submission is not already in progress. A form's submit handler will only be invoked when it should be, and will be passed the model values of all controls in the form. (See: [Submitting](/src/components/Form#submitting))
- Using `ngMessages` for client-side validation has been greatly simplified: errors are defined as a simple array in code, and one line of markup in templates. Sharing error messages across forms no longer requres exposing error copy to templates via controllers. Formation also supports assigning custom error messages on each control -- from your API, for example. (See: [Errors](/src/components/Errors))
- Configuring when to display validation errors is trivial. Either set the behavior application-wide or for each form by providing a list of states (ex: `"touched, submitted"`) to match against. Errors for a given control will be shown if either the control or the form has one of the states.
- Reset all controls to a pristine, untouched state and optionally reset the form's model to an initial state. (See: [showErrorsOn](/src/services/Formation#showerrorsonflags))
- Accessibility: `id` and `for` attributes are managed by the form, so controls and labels are correctly associated without any extra markup.

## Example

Let's take a look at how to create a form using Formation. Keep in mind that Formation does not come bundled with any styles, and class attributes have been omitted here for simplicity.
Here's the template strucutre you might use to construct a simple address form:

```html
 <fm name="vm.addressForm"
  controls="vm.controls"
  show-errors-on="touched, submitted"
  on-submit="vm.submit">
  <div>
    <fm-input type="text" name="name">Name</fm-input>
    <fm-errors for="name"></fm-errors>
  </div>
  <div>
    <fm-input name="streetAddress">Address</fm-input>
    <fm-errors for="streetAddress"></fm-errors>
  </div>
  <div>
    <fm-input name="locality">City</fm-input>
    <fm-errors for="locality"></fm-errors>
  </div>
  <div>
    <fm-select name="state"
      options="state.value as state.label for state in vm.states">
      State
    </fm-select>
    <fm-errors for="state"></fm-errors>
  </div>
  <div>
    <fm-input name="postalCode">Postal Code</fm-input>
    <fm-errors for="postalCode"></fm-errors>
  </div>
  <button type="submit">Submit</button>
</fm>
```

Notice there are no references to `ngModel` on our controls, nor are they cluttered with attribute directives for validation. `ngMessages` are handled with a single component, and all of our markup is concise and semantic.

Before we move to the controller, lets go over everything thats happening, starting with the form element:

- `name`: This will assign a reference to the Formation controller to the provided name under the current scope, just like Angular's form directive. The form's name is also used to construct the `id` attributes assigned to each control. However, it is entirely optional.
- `controls`: Formation will use this object to configure controls. More on this below.
- `show-errors-on`: This attribute can be a string of comma/space delimited flags that correspond to the state flags on an `ngModel` controller instance or the form controller. Formation will check each provided flag first on the control's `ngModel` instance and then the form controller instance. If either have the flag and its current value is truthy (and the control is invalid) errors will be shown for the control. In this case, we are indicating that we want to show errors on invalid controls if they have been touched (the user has focused it and then blurred it) or if the user has tried to submit the form.
- `on-submit`: When the form is submiteed, Formation will ensure there are no pending async validators, ensure the form is valid, then invoke the provided function, passing it an object containing the current model value of each control in the form.

Control elements are designed to be as simple as possible, requiring only a name attribute. Error components use a `for` attribute to indicate which control to show errors for. Under the hood, Formation assigngs unique `id` attributes to controls and ensures labels and error elements are correctly linked to them.

Everything else is configured via the form's parent controller. Let's take a look at that now:

```js
 // A reference to our Angular module instance.
import app from 'app';

// Formation provides several common validators.
import {
  required,
  minLength,
  pattern
} from 'formation/etc/validators';

app.controller('MyCtrl', function () {
  const vm = this;

  vm.controls = {
    // Each key here corresponds to the control name we used in the template.
    name: {
      // Make this field required, and ensure the user enters at least 6 characters:
      validators: {
        required,
        minLength: minLength(6)
      },
      // Error messages are just arrays of validation key/message pairs:
      errors: [
        ['required', 'This field is required.'],
        ['minLength', 'Please enter at least 6 characters.']
      ]
    },
    streetAddress: {
      validators: {required},
      errors: [
        ['required', 'This field is required.']
      ]
    },
    locality: {
      validators: {required},
      errors: [
        ['required', 'This field is required.']
      ]
    },
    state: {
      validators: {required},
      errors: [
        ['required', 'This field is required.']
      ]
    },
    postalCode: {
      validators: {
        required,
        // Require a valid U.S. postal code on this field:
        pattern: pattern(/(\d{5}([-]\d{4})?)/g)
      },
      errors: [
        ['required', 'This field is required.'],
        ['pattern', 'Please enter a valid U.S. postal code.']
      ]
    }
  };

  vm.states = [/* State data. */];

  vm.submit = modelValues => {
    // Do something with modelValues here.
  };
});
```

Wowza! We kept our template focused on structure, and our controller neatly describes exactly how each control in the form should behave. Check out the documentation on [Control Configuration](/src/components/FormationControl#control-configuration) for a detailed breakdown, or head over to [darkobits.github.io/formation](https://darkobits.github.io/formation/) to see a live demo of this form.

## Documentation

Feel free to explore the [source](/src) -- most of the core components are documented with inline READMEs:

- [Formation Provider/Service](/src/services/Formation)
- Components:
  - [Form](/src/components/Form)
  - [Input](/src/components/Input)
  - [Select](/src/components/Select)
  - [Textarea](/src/components/Textarea)
  - [Errors](/src/components/Errors)
- Classes:
  - [FormationControl](/src/components/FormationControl)

[travis-img]: https://img.shields.io/travis/darkobits/formation.svg?style=flat-square
[travis-url]: https://travis-ci.org/darkobits/formation
[david-img]: https://img.shields.io/david/darkobits/formation.svg?style=flat-square
[david-url]: https://david-dm.org/darkobits/formation
[codacy-img]: https://img.shields.io/codacy/coverage/e3fb8e46d6a241f5a952cf3fe6a49d06.svg?style=flat-square
[codacy-url]: https://www.codacy.com/app/darkobits/formation
[xo-img]: https://img.shields.io/badge/code_style-XO-e271a5.svg?style=flat-square
[xo-url]: https://github.com/sindresorhus/xo
[npm-img]: https://img.shields.io/npm/v/@darkobits/formation.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@darkobits/formation
