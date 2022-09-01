const { expect } = require('chai');

const $url = require('../../../lib/util/url');

describe('Return the extension of a URL', function () {
  it("should return an empty string if there isn't any extension", async function () {
    const extension = await $url.getExtension('/file');
    expect(extension).to.equal('');
  });

  it('should return the extension in lowercase', async function () {
    const extension = await $url.getExtension('/file.YML');
    expect(extension).to.equal('.yml');
  });

  it('should return the extension without the query', async function () {
    const extension = await $url.getExtension('/file.yml?foo=bar');
    expect(extension).to.equal('.yml');
  });
});
