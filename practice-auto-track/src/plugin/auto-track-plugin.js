const { declare } = require("@babel/helper-plugin-utils");
const importModule = require("@babel/helper-module-imports");

const autoTrackPlugin = declare((api, options) => {
  api.assertVersion(7);

  return {
    visitor: {
      Program: {
        enter(path, state) {
          path.traverse({
            ImportDeclaration(curPath) {
              const requirePath = curPath.get("source").node.value;
              if (requirePath === options.trackerPath) {
                const specifierPath = curPath.get("specifiers.0");
                if (specifierPath.isImportSpecifier()) {
                  state.trackerImportId = specifierPath.toString();
                } else {
                  state.trackerImportId = specifierPath.get("local").toString();
                }
                path.stop();
              }
            },
          });

          if (!state.trackerImportId) {
            state.trackerImportId = importModule.addDefault(path, "tracker", {
              nameHint: path.scope.generateUid("tracker"),
            }).name;
            state.trackerAst = api.template.statement(
              `${state.trackerImportId}()`
            )();
          }
        },
      },
      "ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration"(
        path,
        state
      ) {
        const bodyPath = path.get("body");
        if (bodyPath.isBlockStatement()) {
          bodyPath.node.body.unshift(state.trackerAst);
        } else {
          const ast = api.template.statement(
            `{${state.trackerImportId}(); return PREV_NODE}`
          )({ PREV_NODE: bodyPath.node });
          bodyPath.replaceWith(ast);
        }
      },
    },
  };
});

module.exports = autoTrackPlugin;
