#!/usr/bin/env sh

# Syncs the contents of a feed to S3

s3cmd put --access_key=$AWS_ACCESS_KEY --secret_key=$AWS_SECRET_KEY --acl-public sync $OUTPUT_DIR/* s3://$S3_BUCKET/$S3_PREFIX
