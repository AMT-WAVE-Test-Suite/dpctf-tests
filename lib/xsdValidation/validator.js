function validate(xml, schemes, logger) {
    logger.log("=== VALIDATION STARTED ===");
    try {
        // 1. write XSD-files into a virtual directory
        logger.log("Writing xsd-schemas to virtual FS...");
        Module.FS.writeFile('/DASH-MPD.xsd', schemes[0]);    // main scheme
        Module.FS.writeFile('/xlink.xsd', schemes[1]);  // dependencies
        Module.FS.writeFile('/xml.xsd', schemes[2]);

        // 2. write the XML-string to memory
        logger.log("Allocating memory for XML content...");
        const ptrXml = Module._malloc(lengthBytesUTF8(xml) + 1);
        stringToUTF8(xml, Module.HEAPU8, ptrXml, lengthBytesUTF8(xml) + 1);

        // 3. parse XML-document
        logger.log("Parsing XML document...");
        const xmlDoc = Module.ccall(
        'xmlReadMemory',
        'number',
        ['number', 'number', 'number', 'number', 'number'],
        [ptrXml, lengthBytesUTF8(xml), null, null, 0]
        );

        // 4. load scheme from file DASH-MPD.xsd (that imports work)
        logger.log('Creating schema parser context...');
        const schemaParserCtx = Module.ccall(
        'xmlSchemaNewParserCtxt',
        'number',
        ['string'],
        ['/DASH-MPD.xsd']
        );

        // 5. parse schema and create validation context
        const schema = Module.ccall('xmlSchemaParse', 'number', ['number'], [schemaParserCtx]);
        logger.log("Schema parsed, pointer:", schema);
        const validCtx = Module.ccall('xmlSchemaNewValidCtxt', 'number', ['number'], [schema]);
        logger.log("Validation context created:", validCtx);

        // 6. validate XML
        logger.log("Validating XML document against schema...");
        const result = Module.ccall(
        'xmlSchemaValidateDoc',
        'number',
        ['number', 'number'],
        [validCtx, xmlDoc]
        );
        

        // 7. release memory
        logger.log("Cleaning up memory...");
        Module.ccall('xmlFreeDoc', 'void', ['number'], [xmlDoc]);
        Module.ccall('xmlSchemaFreeValidCtxt', 'void', ['number'], [validCtx]);
        Module.ccall('xmlSchemaFree', 'void', ['number'], [schema]);
        Module._free(ptrXml);

        logger.log("=== VALIDATION RESULT ===");
        logger.log("Raw validation result:", result);
        logger.log("Validation success:", result === 0);

        // 8. return result
        const isValid = result === 0;
        logger.log("=== VALIDATION FINISHED ===");
        return isValid;

    } catch (error) {
        logger.log("=== VALIDATION ERROR ===");
        logger.log(error.message);
        console.error("=== VALIDATION ERROR ===", error);
        console.error("Error stack:", error.stack);
        return false;
    }
}

function stringToUTF8(str, heap, offset, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    const utf8encoder = new TextEncoder();
    const encoded = utf8encoder.encode(str);
    const len = Math.min(encoded.length, maxBytesToWrite - 1);
    heap.set(encoded.subarray(0, len), offset);
    heap[offset + len] = 0;
    return len;
}