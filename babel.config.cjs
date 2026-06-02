// Babel lets Jest transform both ESM and CommonJS in this "type":"module" repo.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
