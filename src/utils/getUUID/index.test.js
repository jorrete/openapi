import getUUID from ".";

it("should return a match against a GUUID regexp several times", () => {
    for (let i; i++; i<5) {
        let generatedUUID = getUUID()
        expect(generatedUUID).toMatch(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/)
    }
})