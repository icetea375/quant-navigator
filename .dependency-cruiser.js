module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'This dependency is part of a circular relationship. You might want to revise your solution (i.e. use dependency inversion, make sure the modules have a single responsibility) ',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'This is an orphan module - it\'s likely not used (anymore?). Either use it or remove it. If it\'s logical this module is an orphan (i.e. it\'s a config file), add an exception for it in your dependency-cruiser configuration.',
      from: {
        orphan: true,
        pathNot: [
          '^src/.*\\.d\\.ts$',
          '^src/.*\\.config\\.(js|ts)$',
          '^src/.*\\.test\\.(js|ts)$',
          '^src/.*\\.spec\\.(js|ts)$'
        ]
      },
      to: {}
    },
    {
      name: 'no-deprecated-core',
      severity: 'warn',
      comment: 'A module depends on a node core module that has been deprecated. Find an alternative - these are bound to exist - node doesn\'t deprecate lightly.',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: [
          '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$'
        ]
      }
    },
    {
      name: 'not-to-deprecated',
      severity: 'warn',
      comment: 'This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later version of that module, or find an alternative. Deprecated modules are a security risk.',
      from: {},
      to: {
        dependencyTypes: ['deprecated']
      }
    },
    {
      name: 'no-non-package-json',
      severity: 'warn',
      comment: 'This module depends on an npm package that isn\'t in the \'dependencies\' section of your package.json. That\'s problematic as the package either (1) won\'t be available on live (2) will be loaded by the package manager it is available but all the other dependencies won\'t be (3) the package is available but all the other dependencies won\'t be. This might create problems with your package-lock.json or yarn.lock file.',
      from: {},
      to: {
        dependencyTypes: ['npm'],
        pathNot: [
          '^node_modules/'
        ]
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: false,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          graph: {
            splines: 'ortho'
          },
          modules: [
            {
              criteria: { source: '^src/' },
              attributes: { fillcolor: 'lime' }
            },
            {
              criteria: { dependencyTypes: ['npm'] },
              attributes: { fillcolor: 'orange' }
            },
            {
              criteria: { dependencyTypes: ['core'] },
              attributes: { fillcolor: 'lightblue' }
            }
          ]
        }
      },
      text: {
        highlightFocused: true
      }
    }
  }
};
