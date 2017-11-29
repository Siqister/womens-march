//https://github.com/andrewrk/node-s3-client/issues/175
var AWS = require('aws-sdk');
var s3 = require('s3');
var config = require('./deploy.config');

var awsS3Client = new AWS.S3({
	accessKeyId:config.AwsAccessKeyId,
	secretAccessKey:config.AwsSecretAccessKey,
	signatureVersion:'v4',
	region:config.BucketRegion
});

var client = s3.createClient({
	s3Client:awsS3Client
});

var uploader = client.uploadDir({
	localDir:process.argv[2],
	s3Params:{
		Bucket:config.Bucket,
		ACL:'public-read'
	}
});

uploader.on('error',function(err){
	console.log('Error', err.stack);
});

uploader.on('progress',function(){
	console.log('Progress', uploader.progressAmount, uploader.progressTotal);
});

uploader.on('end',function(){
	console.log(process.argv[2] + ' uploaded to s3 bucket ' + config.Bucket);
});