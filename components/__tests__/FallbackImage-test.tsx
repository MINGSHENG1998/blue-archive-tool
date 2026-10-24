import * as React from "react";
import { Image, Text } from "react-native";
import renderer, { act } from "react-test-renderer";

import { FallbackImage } from "../FallbackImage";

// RN components do not satisfy react-test-renderer's own ElementType typing.
type TestElementType = Parameters<renderer.ReactTestInstance["findByType"]>[0];
const ImageType = Image as unknown as TestElementType;
const TextType = Text as unknown as TestElementType;

const uriOf = (tree: renderer.ReactTestRenderer) =>
  (tree.root.findByType(ImageType).props.source as { uri: string }).uri;

const failCurrent = (tree: renderer.ReactTestRenderer) =>
  act(() => {
    tree.root.findByType(ImageType).props.onError();
  });

it("moves to the next uri when one fails, then shows the placeholder", () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <FallbackImage
        uris={["https://a/1.webp", undefined, "https://b/1.webp"]}
        label="erina"
        style={{ width: 40, height: 40 }}
      />,
    );
  });

  expect(uriOf(tree)).toBe("https://a/1.webp");
  failCurrent(tree);
  expect(uriOf(tree)).toBe("https://b/1.webp");
  failCurrent(tree);

  expect(tree.root.findAllByType(ImageType)).toHaveLength(0);
  tree.root.findByProps({ testID: "fallback-image-placeholder" });
  expect(tree.root.findByType(TextType).props.children).toBe("E");
});

it("starts over when it is given a different list", () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<FallbackImage uris={["https://a/1.webp"]} />);
  });
  failCurrent(tree);
  expect(tree.root.findAllByType(ImageType)).toHaveLength(0);

  act(() => {
    tree.update(<FallbackImage uris={["https://a/2.webp"]} />);
  });
  expect(uriOf(tree)).toBe("https://a/2.webp");
});

it("renders the placeholder straight away with nothing to load", () => {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(<FallbackImage uris={[]} />);
  });
  tree.root.findByProps({ testID: "fallback-image-placeholder" });
});
