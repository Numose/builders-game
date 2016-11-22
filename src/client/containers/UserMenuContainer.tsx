import { connect } from 'react-redux';

import UserMenu from '../components/UserMenu';

const mapStateToProps = (state) => {
  console.log(state.authReducer.isAuth)
  return {
    user: state.authReducer.profile.name,
    isAuth: state.authReducer.isAuth
  };
};

export default connect(
    mapStateToProps
  )(UserMenu);