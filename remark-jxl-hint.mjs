export default function remarkJxlHint() {
  return function (tree) {
    function walk(node, parent, index) {
      if (node?.type === 'image' && node?.alt === 'jxl hint') {
        const fallbackText =
          'If you cannot see this image, either your browser does not support the JXL format, or it has been disabled by default. Click here to learn more.';

        // Clone the properties for the interior image node
        const imgNode = { ...node, alt: fallbackText };

        // Mutate the parent node to a link
        node.type = 'link';
        node.url = '/blog/2026-03-05-the-rise-fall-and-resurrection-of-jpeg-xl/';
        node.title = null;
        node.children = [imgNode];

        // Clean up properties that belong to image but not link
        delete node.alt;
        delete node.value;
      }

      if (node?.children && Array.isArray(node.children)) {
        node.children.forEach((child, i) => walk(child, node, i));
      }
    }

    walk(tree, null, 0);
  };
}
