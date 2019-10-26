const {
  Aborter,
  BlockBlobURL,
  ContainerURL,
  ServiceURL,
  SharedKeyCredential,
  StorageURL,
  uploadStreamToBlockBlob,
  uploadFileToBlockBlob
} = require("@azure/storage-blob");

const STORAGE_ACCOUNT_NAME = "cab432assignment2data";
const ACCOUNT_ACCESS_KEY = "8cK+JPO184nNHVrcZ0fh9S3f/0DSRdfZRuNzqatqGwU2sQgizuHujd1gVkDvvFUlzhmY0obS520vGQvIAv/LEA==";

const credentials = new SharedKeyCredential(STORAGE_ACCOUNT_NAME, ACCOUNT_ACCESS_KEY);
const pipeline = StorageURL.newPipeline(credentials);

const serviceURL = new ServiceURL(`https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`, pipeline);
const containerURL = ContainerURL.fromServiceURL(serviceURL, "twitterData");

const aborter = Aborter.timeout(30 * 60 * 1000); // 30 second timeout

// read a ReadableStream to a string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

async function returnBlobNames() {
  let marker = undefined;
  let names = [];

  do {
    const listBlobsResponse = await containerURL.listBlobFlatSegment(aborter, marker);
    marker = listBlobsResponse.nextMarker;
    for (const blob of listBlobsResponse.segment.blobItems) {
      names.push(blob.name);
    }
  } while (marker);

  return (names);
}

async function uploadBlob(content, blobName) {
  try {
    const blockBlobURL = BlockBlobURL.fromContainerURL(containerURL, blobName);
    await blockBlobURL.upload(aborter, content, content.length);
  } catch (e) {
    throw (e);
  }
}

async function downloadBlob(blobName) {
  const blockBlobURL = BlockBlobURL.fromContainerURL(containerURL, blobName);

  const downloadResponse = await blockBlobURL.download(aborter, 0);
  const downloadedContent = await streamToString(downloadResponse.readableStreamBody);

  const contentString = await streamToString(downloadedContent);

  return contentString;
}

module.exports = {
  returnBlobNames: returnBlobNames,
  uploadBlob: uploadBlob,
  downloadBlob: downloadBlob
}