/**
 * Renders a form that allows org users to invite new users
 * to cloud.gov
 */

import PropTypes from 'prop-types';
import React from 'react';
import Action from './action.jsx';
import FormStore from '../stores/form_store';
import { Form, FormSelect } from './form';
import PanelDocumentation from './panel_documentation.jsx';
import userActions from '../actions/user_actions';
import { validateString } from '../util/validators';

const USERS_PARENT_ENTITY_USER_FORM_GUID = 'users-parent-entity-users-form';

const propTypes = {
  userParentEntityUserSelectDisabled: PropTypes.bool,
  currentUserAccess: PropTypes.bool,
  parentEntityUsers: PropTypes.array,
  error: PropTypes.object
};
const defaultProps = {
  userParentEntityUserSelectDisabled: false,
  currentUserAccess: false,
  error: {}
};

function stateSetter(props) {
  return {
    // Find a way to get all users in this org
    parentEntityUsers: props.parentEntityUsers,
    error: props.error
  };
}

export default class UsersParentEntityUserSelector extends React.Component {
  constructor(props) {
    super(props);
    FormStore.create(USERS_PARENT_ENTITY_USER_FORM_GUID);

    this.state = stateSetter(props);

    this.validateString = validateString().bind(this);
    this._onSubmitForm = this._onSubmitForm.bind(this);
  }

  _onSubmitForm(errs, values) {
    if (values.username) {
      const username = values.username.value;
      userActions.addUserToSpace(username);
    }
  }

  get errorMessage() {
    const { error } = this.props;

    if (!error) return '';

    const message = error.contextualMessage;

    if (error.message) {
      return `${message}: ${error.message}.`;
    }

    return message;
  }

  get invitationMessage() {
    const parentEntity = this.props.parentEntity;
    const currentEntity = this.props.currentEntity;

    return `Invite an existing user in this ${parentEntity}` +
      ` to this ${currentEntity}.`;
  }

  get userSelector() {
    const orgUsers = this.state.parentEntityUsers.map((user) => {
      return { value: user.guid, label: user.username };
    });

    if (!orgUsers) {
      return null;
    }

    return (
      <FormSelect
        formGuid={ USERS_PARENT_ENTITY_USER_FORM_GUID }
        classes={ ['test-users_parent_entity_user_name'] }
        label="Username"
        name="username"
        options={ orgUsers }
        validator={ this.validateString }
      />
    )
  }

  render() {
    const { userParentEntityUserSelectDisabled } = this.props;

    if (!this.props.currentUserAccess) {
      return null;
    }

    return (
      <div className="test-users-invite">
        <PanelDocumentation description>
          <p>{ this.invitationMessage }</p>
        </PanelDocumentation>
        <Form
          guid={ USERS_PARENT_ENTITY_USER_FORM_GUID }
          classes={ ['users_parent_entity_user_form'] }
          ref="form"
          onSubmit={ this._onSubmitForm }
          errorOverride={ this.errorMessage }
        >
          { this.userSelector }
          <Action
            label="submit"
            type="submit"
            disabled={ userParentEntityUserSelectDisabled }
          >
            Add user to this { this.state.currentEntity }
          </Action>
        </Form>
      </div>
    );
  }

}

UsersParentEntityUserSelector.propTypes = propTypes;

UsersParentEntityUserSelector.defaultProps = defaultProps;