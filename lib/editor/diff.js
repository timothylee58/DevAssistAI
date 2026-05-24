/**
 * @file diff.js
 * @description Diff computation engine for document versioning in the ProseMirror
 * editor. Compares two ProseMirror document nodes and produces a merged document
 * with inline diff marks (inserted/deleted) for visual diffing. Uses sentence-level
 * tokenization with the diff-match-patch library for text node comparison, and
 * recursive node matching for structural changes. Adapted from prosemirror-diff
 * by hamflx (https://github.com/hamflx/prosemirror-diff).
 */

// Modified from https://github.com/hamflx/prosemirror-diff/blob/master/src/diff.js

import { diff_match_patch } from "diff-match-patch";
import { Fragment, Node } from "prosemirror-model";

export const DiffType = {
  Unchanged: 0,
  Deleted: -1,
  Inserted: 1,
};

export const patchDocumentNode = (schema, oldNode, newNode) => {
  assertNodeTypeEqual(oldNode, newNode);

  const finalLeftChildren = [];
  const finalRightChildren = [];

  const oldChildren = normalizeNodeContent(oldNode);
  const newChildren = normalizeNodeContent(newNode);
  const oldChildLen = oldChildren.length;
  const newChildLen = newChildren.length;
  const minChildLen = Math.min(oldChildLen, newChildLen);

  let leftMatchCount = 0;
  let rightMatchCount = 0;

  for (; leftMatchCount < minChildLen; leftMatchCount++) {
    const oldChild = oldChildren[leftMatchCount];
    const newChild = newChildren[leftMatchCount];
    if (!isNodeEqual(oldChild, newChild)) {
      break;
    }
    finalLeftChildren.push(...ensureArray(oldChild));
  }

  for (; rightMatchCount + leftMatchCount + 1 < minChildLen; rightMatchCount++) {
    const oldChild = oldChildren[oldChildLen - rightMatchCount - 1];
    const newChild = newChildren[newChildLen - rightMatchCount - 1];
    if (!isNodeEqual(oldChild, newChild)) {
      break;
    }
    finalRightChildren.unshift(...ensureArray(oldChild));
  }

  const diffOldChildren = oldChildren.slice(leftMatchCount, oldChildLen - rightMatchCount);
  const diffNewChildren = newChildren.slice(leftMatchCount, newChildLen - rightMatchCount);

  if (diffOldChildren.length && diffNewChildren.length) {
    const matchedNodes = matchNodes(
      schema,
      diffOldChildren,
      diffNewChildren
    ).sort((a, b) => b.count - a.count);
    const bestMatch = matchedNodes[0];
    if (bestMatch) {
      const { oldStartIndex, newStartIndex, oldEndIndex, newEndIndex } =
        bestMatch;
      const oldBeforeMatchChildren = diffOldChildren.slice(0, oldStartIndex);
      const newBeforeMatchChildren = diffNewChildren.slice(0, newStartIndex);

      finalLeftChildren.push(
        ...patchRemainNodes(
          schema,
          oldBeforeMatchChildren,
          newBeforeMatchChildren
        )
      );
      finalLeftChildren.push(
        ...diffOldChildren.slice(oldStartIndex, oldEndIndex)
      );

      const oldAfterMatchChildren = diffOldChildren.slice(oldEndIndex);
      const newAfterMatchChildren = diffNewChildren.slice(newEndIndex);

      finalRightChildren.unshift(
        ...patchRemainNodes(
          schema,
          oldAfterMatchChildren,
          newAfterMatchChildren
        )
      );
    } else {
      finalLeftChildren.push(
        ...patchRemainNodes(schema, diffOldChildren, diffNewChildren)
      );
    }
  } else {
    finalLeftChildren.push(
      ...patchRemainNodes(schema, diffOldChildren, diffNewChildren)
    );
  }

  return createNewNode(oldNode, [...finalLeftChildren, ...finalRightChildren]);
};

const matchNodes = (_schema, oldChildren, newChildren) => {
  const matches = [];
  for (
    let oldStartIndex = 0;
    oldStartIndex < oldChildren.length;
    oldStartIndex++
  ) {
    const oldStartNode = oldChildren[oldStartIndex];
    const newStartIndex = findMatchNode(newChildren, oldStartNode);

    if (newStartIndex !== -1) {
      let oldEndIndex = oldStartIndex + 1;
      let newEndIndex = newStartIndex + 1;
      for (
        ;
        oldEndIndex < oldChildren.length && newEndIndex < newChildren.length;
        oldEndIndex++, newEndIndex++
      ) {
        const oldEndNode = oldChildren[oldEndIndex];
        if (!isNodeEqual(newChildren[newEndIndex], oldEndNode)) {
          break;
        }
      }
      matches.push({
        oldStartIndex,
        newStartIndex,
        oldEndIndex,
        newEndIndex,
        count: newEndIndex - newStartIndex,
      });
    }
  }
  return matches;
};

const findMatchNode = (children, node, startIndex = 0) => {
  for (let childIndex = startIndex; childIndex < children.length; childIndex++) {
    if (isNodeEqual(children[childIndex], node)) {
      return childIndex;
    }
  }
  return -1;
};

const patchRemainNodes = (schema, oldChildren, newChildren) => {
  const finalLeftChildren = [];
  const finalRightChildren = [];
  const oldChildLen = oldChildren.length;
  const newChildLen = newChildren.length;
  let leftPointer = 0;
  let rightPointer = 0;
  while (oldChildLen - leftPointer - rightPointer > 0 && newChildLen - leftPointer - rightPointer > 0) {
    const leftOldNode = oldChildren[leftPointer];
    const leftNewNode = newChildren[leftPointer];
    const rightOldNode = oldChildren[oldChildLen - rightPointer - 1];
    const rightNewNode = newChildren[newChildLen - rightPointer - 1];
    let updateLeft =
      !isTextNode(leftOldNode) && matchNodeType(leftOldNode, leftNewNode);
    let updateRight =
      !isTextNode(rightOldNode) && matchNodeType(rightOldNode, rightNewNode);
    if (Array.isArray(leftOldNode) && Array.isArray(leftNewNode)) {
      finalLeftChildren.push(
        ...patchTextNodes(schema, leftOldNode, leftNewNode)
      );
      leftPointer += 1;
      continue;
    }

    if (updateLeft && updateRight) {
      const equalityLeft = computeChildEqualityFactor(leftOldNode, leftNewNode);
      const equalityRight = computeChildEqualityFactor(
        rightOldNode,
        rightNewNode
      );
      if (equalityLeft < equalityRight) {
        updateLeft = false;
      } else {
        updateRight = false;
      }
    }
    if (updateLeft) {
      finalLeftChildren.push(
        patchDocumentNode(schema, leftOldNode, leftNewNode)
      );
      leftPointer += 1;
    } else if (updateRight) {
      finalRightChildren.unshift(
        patchDocumentNode(schema, rightOldNode, rightNewNode)
      );
      rightPointer += 1;
    } else {
      // Delete and insert
      finalLeftChildren.push(
        createDiffNode(schema, leftOldNode, DiffType.Deleted)
      );
      finalLeftChildren.push(
        createDiffNode(schema, leftNewNode, DiffType.Inserted)
      );
      leftPointer += 1;
    }
  }

  const deleteNodeLen = oldChildLen - leftPointer - rightPointer;
  const insertNodeLen = newChildLen - leftPointer - rightPointer;
  if (deleteNodeLen) {
    finalLeftChildren.push(
      ...oldChildren
        .slice(leftPointer, leftPointer + deleteNodeLen)
        .flat()
        .map((node) => createDiffNode(schema, node, DiffType.Deleted))
    );
  }

  if (insertNodeLen) {
    finalRightChildren.unshift(
      ...newChildren
        .slice(leftPointer, leftPointer + insertNodeLen)
        .flat()
        .map((node) => createDiffNode(schema, node, DiffType.Inserted))
    );
  }

  return [...finalLeftChildren, ...finalRightChildren];
};

// Updated function to perform sentence-level diffs
export const patchTextNodes = (schema, oldNode, newNode) => {
  const diffMatchPatcher = new diff_match_patch();

  // Concatenate the text from the text nodes
  const oldText = oldNode.map((n) => getNodeText(n)).join("");
  const newText = newNode.map((n) => getNodeText(n)).join("");

  // Tokenize the text into sentences
  const oldSentences = tokenizeSentences(oldText);
  const newSentences = tokenizeSentences(newText);

  // Map sentences to unique characters
  const { oldEncodedChars, newEncodedChars, sentenceArray } = sentencesToChars(
    oldSentences,
    newSentences
  );

  // Perform the diff
  let sentenceDiffs = diffMatchPatcher.diff_main(oldEncodedChars, newEncodedChars, false);

  // Convert back to sentences
  sentenceDiffs = sentenceDiffs.map(([type, text]) => {
    const sentences = text
      .split("")
      .map((char) => sentenceArray[char.charCodeAt(0)]);
    return [type, sentences];
  });

  // Map diffs to nodes
  const diffedTextNodes = sentenceDiffs.flatMap(([type, sentences]) => {
    return sentences.map((sentence) => {
      const node = createTextNode(
        schema,
        sentence,
        type !== DiffType.Unchanged ? [createDiffMark(schema, type)] : []
      );
      return node;
    });
  });

  return diffedTextNodes;
};

// Function to tokenize text into sentences
const tokenizeSentences = (text) => {
  return text.match(/[^.!?]+[.!?]*\s*/g) || [];
};

// Function to map sentences to unique characters
const sentencesToChars = (oldSentences, newSentences) => {
  const sentenceArray = [];
  const sentenceCharCodeMap = {};
  let nextCharCode = 0;

  const oldEncodedChars = oldSentences
    .map((sentence) => {
      if (sentence in sentenceCharCodeMap) {
        return String.fromCharCode(sentenceCharCodeMap[sentence]);
      }
      sentenceCharCodeMap[sentence] = nextCharCode;
      sentenceArray[nextCharCode] = sentence;
      nextCharCode++;
      return String.fromCharCode(sentenceCharCodeMap[sentence]);
    })
    .join("");

  const newEncodedChars = newSentences
    .map((sentence) => {
      if (sentence in sentenceCharCodeMap) {
        return String.fromCharCode(sentenceCharCodeMap[sentence]);
      }
      sentenceCharCodeMap[sentence] = nextCharCode;
      sentenceArray[nextCharCode] = sentence;
      nextCharCode++;
      return String.fromCharCode(sentenceCharCodeMap[sentence]);
    })
    .join("");

  return { oldEncodedChars, newEncodedChars, sentenceArray };
};

export const computeChildEqualityFactor = (_node1, _node2) => {
  return 0;
};

export const assertNodeTypeEqual = (node1, node2) => {
  if (getNodeProperty(node1, "type") !== getNodeProperty(node2, "type")) {
    throw new Error(`node type not equal: ${node1.type} !== ${node2.type}`);
  }
};

export const ensureArray = (value) => {
  return Array.isArray(value) ? value : [value];
};

export const isNodeEqual = (node1, node2) => {
  const isNode1Array = Array.isArray(node1);
  const isNode2Array = Array.isArray(node2);
  if (isNode1Array !== isNode2Array) {
    return false;
  }
  if (isNode1Array) {
    return (
      node1.length === node2.length &&
      node1.every((node, index) => isNodeEqual(node, node2[index]))
    );
  }

  const type1 = getNodeProperty(node1, "type");
  const type2 = getNodeProperty(node2, "type");
  if (type1 !== type2) {
    return false;
  }
  if (isTextNode(node1)) {
    const text1 = getNodeProperty(node1, "text");
    const text2 = getNodeProperty(node2, "text");
    if (text1 !== text2) {
      return false;
    }
  }
  const attrs1 = getNodeAttributes(node1);
  const attrs2 = getNodeAttributes(node2);
  const attrs = [...new Set([...Object.keys(attrs1), ...Object.keys(attrs2)])];
  for (const attr of attrs) {
    if (attrs1[attr] !== attrs2[attr]) {
      return false;
    }
  }
  const marks1 = getNodeMarks(node1);
  const marks2 = getNodeMarks(node2);
  if (marks1.length !== marks2.length) {
    return false;
  }
  for (let i = 0; i < marks1.length; i++) {
    if (!isNodeEqual(marks1[i], marks2[i])) {
      return false;
    }
  }
  const children1 = getNodeChildren(node1);
  const children2 = getNodeChildren(node2);
  if (children1.length !== children2.length) {
    return false;
  }
  for (let i = 0; i < children1.length; i++) {
    if (!isNodeEqual(children1[i], children2[i])) {
      return false;
    }
  }
  return true;
};

export const normalizeNodeContent = (node) => {
  const content = getNodeChildren(node) ?? [];
  const normalizedChildren = [];
  for (let i = 0; i < content.length; i++) {
    const child = content[i];
    if (isTextNode(child)) {
      const textNodes = [];
      for (
        let textNode = content[i];
        i < content.length && isTextNode(textNode);
        textNode = content[++i]
      ) {
        textNodes.push(textNode);
      }
      i--;
      normalizedChildren.push(textNodes);
    } else {
      normalizedChildren.push(child);
    }
  }
  return normalizedChildren;
};

export const getNodeProperty = (node, property) => {
  if (property === "type") {
    return node.type?.name;
  }
  return node[property];
};

export const getNodeAttribute = (node, attribute) =>
  node.attrs ? node.attrs[attribute] : undefined;

export const getNodeAttributes = (node) => (node.attrs ? node.attrs : {});

export const getNodeMarks = (node) => node.marks ?? [];

export const getNodeChildren = (node) => node.content?.content ?? [];

export const getNodeText = (node) => node.text;

export const isTextNode = (node) => node.type?.name === "text";

export const matchNodeType = (node1, node2) =>
  node1.type?.name === node2.type?.name ||
  (Array.isArray(node1) && Array.isArray(node2));

export const createNewNode = (oldNode, children) => {
  if (!oldNode.type) {
    throw new Error("oldNode.type is undefined");
  }
  return new Node(
    oldNode.type,
    oldNode.attrs,
    Fragment.fromArray(children),
    oldNode.marks
  );
};

export const createDiffNode = (schema, node, type) => {
  return mapDocumentNode(node, (currentNode) => {
    if (isTextNode(currentNode)) {
      return createTextNode(schema, getNodeText(currentNode), [
        ...(currentNode.marks || []),
        createDiffMark(schema, type),
      ]);
    }
    return currentNode;
  });
};

function mapDocumentNode(node, mapper) {
  const copy = node.copy(
    Fragment.from(
      node.content.content
        .map((currentNode) => mapDocumentNode(currentNode, mapper))
        .filter((mappedNode) => mappedNode)
    )
  );
  return mapper(copy) || copy;
}

export const createDiffMark = (schema, type) => {
  if (type === DiffType.Inserted) {
    return schema.mark("diffMark", { type });
  }
  if (type === DiffType.Deleted) {
    return schema.mark("diffMark", { type });
  }
  throw new Error("type is not valid");
};

export const createTextNode = (schema, content, marks = []) => {
  return schema.text(content, marks);
};

export const diffEditor = (schema, oldDoc, newDoc) => {
  const oldNode = Node.fromJSON(schema, oldDoc);
  const newNode = Node.fromJSON(schema, newDoc);
  return patchDocumentNode(schema, oldNode, newNode);
};
