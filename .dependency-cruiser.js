module.exports = {
  rules: [
    {
      name: 'no-circular-dependencies',
      comment: '禁止循环依赖',
      severity: 'error',
      from: {},
      to: {
        circular: true
      }
    }
  ]
};
