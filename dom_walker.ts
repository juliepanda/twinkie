import { AliasMap } from "./types";
import { isDomRepeat, isExpressionFunction, getFunctionName } from "./utils";
import { extractExpression } from "./expression_extractor";
const BLACKLISTED_TAGS = new Set(["style", "script"]);

export function extractNodeAttributes(node: CheerioElement) {
  const ret = [];
  for (const attrKey of Object.keys(node.attribs || {})) {
    ret.push({
      attributeKey: attrKey,
      attributeValue: node.attribs[attrKey]
    });
  }

  return ret;
}

export function extractNodeContents(node: CheerioElement) {
  if (node.type !== "comment" && node.nodeValue != null) {
    return node.nodeValue;
  }

  return null;
}

export function walkNodes(
  node: CheerioElement,
  aliasMap: AliasMap,
  fn: (node: CheerioElement, aliasMap: AliasMap) => void
) {
  if (node == null) {
    return;
  }

  fn(node, aliasMap);

  const isDomRepeatNode = isDomRepeat(node);
  let itemAliasName: string | undefined = undefined;
  let indexAsAliasName: string | undefined = undefined;

  if (isDomRepeatNode) {
    const asExpression = extractExpression(node.attribs["items"], aliasMap)[0];

    itemAliasName = node.attribs["as"] || "item";
    indexAsAliasName = node.attribs["index-as"] || "index";

    if (isExpressionFunction(asExpression)) {
      aliasMap[itemAliasName] = `${getFunctionName(asExpression)}[]`;
    } else {
      aliasMap[itemAliasName] = `${asExpression}[]`;
    }

    aliasMap[indexAsAliasName] = "index";
  }

  if (!BLACKLISTED_TAGS.has(node.type)) {
    (node.childNodes || []).forEach(childNode => {
      walkNodes(childNode, aliasMap, fn);
    });
  }

  if (
    isDomRepeatNode &&
    itemAliasName !== undefined &&
    indexAsAliasName !== undefined
  ) {
    delete aliasMap[itemAliasName];
    delete aliasMap[indexAsAliasName];
  }
}
