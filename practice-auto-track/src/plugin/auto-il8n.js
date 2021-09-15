const { declare } = require("@babel/helper-plugin-utils");
const importModule = require("@babel/helper-module-imports");

const autoIl8nPlugin = declare((api, options) => {
  api.assertVersion(7);

  return {
    pre(file) {},
    visitor: {
      Program: {
        // 对未引入intl的文件引入
        enter(path, state) {
          let imported;
          path.traverse({
            ImportDeclaration(curPath) {
              const requirePath = curPath.get("source").node.value;
              if (requirePath === "intl") {
                imported = true;
              }
            },
          });
          if (!imported) {
            const uid = path.scope.generateUid("intl");
            const importAst = api.template.ast(`import ${uid} from 'intl`);
            path.node.body.unshift(importAst);
            state.intlUid = uid;
          }
        },
      },
    },
    post(file) {},
  };
});

module.exports = autoIl8nPlugin;
