"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOptionsWithSchema = exports.InvalidInputOptions = void 0;
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class InvalidInputOptions extends core_1.schema.SchemaValidationException {
    constructor(options, errors) {
        super(errors, `Schematic input does not validate against the Schema: ${JSON.stringify(options)}\nErrors:\n`);
    }
}
exports.InvalidInputOptions = InvalidInputOptions;
// This can only be used in NodeJS.
function validateOptionsWithSchema(registry) {
    return (schematic, options, context) => {
        // Prevent a schematic from changing the options object by making a copy of it.
        options = (0, core_1.deepCopy)(options);
        const withPrompts = context ? context.interactive : true;
        if (schematic.schema && schematic.schemaJson) {
            // Make a deep copy of options.
            return (0, rxjs_1.from)(registry.compile(schematic.schemaJson)).pipe((0, operators_1.mergeMap)((validator) => validator(options, { withPrompts })), (0, operators_1.first)(), (0, operators_1.map)((result) => {
                if (!result.success) {
                    throw new InvalidInputOptions(options, result.errors || []);
                }
                return options;
            }));
        }
        return (0, rxjs_1.of)(options);
    };
}
exports.validateOptionsWithSchema = validateOptionsWithSchema;
