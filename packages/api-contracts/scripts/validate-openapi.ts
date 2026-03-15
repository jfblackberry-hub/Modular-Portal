import { openApiSpecification } from '../src/openapi.js';

console.log(
  `Loaded OpenAPI spec with ${Object.keys(openApiSpecification.paths).length} paths`
);
