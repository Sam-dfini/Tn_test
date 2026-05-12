module.exports = {
  forbidden: [{
    name: 'no-circular',
    from: {},
    to: {
      circular: true
    }
  }],
  options: {
    doNotFollow: {
      path: 'node_modules'
    }
  }
};
