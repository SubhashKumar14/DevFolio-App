import assert from 'node:assert/strict';
import test from 'node:test';
import { describeMongoConnectionError } from '../src/config/mongoConnectionDiagnostics.js';

test('explains DNS SRV ENOTFOUND without exposing credentials', () => {
  const output = describeMongoConnectionError(
    new Error('querySrv ENOTFOUND _mongodb._tcp.cluster0.sbwlbt0.mongodb.net'),
    'mongodb+srv://alice:secret@cluster0.sbwlbt0.mongodb.net/devfolio'
  );
  assert.match(output, /Atlas DNS SRV lookup failed/);
  assert.match(output, /MONGODB_URI/);
  assert.doesNotMatch(output, /secret/);
});

test('recognizes DNS error code nested in cause', () => {
  const output = describeMongoConnectionError(
    { message: 'DNS lookup failed', cause: { code: 'ENOTFOUND' } },
    'mongodb+srv://cluster.example.net/devfolio'
  );
  assert.match(output, /DNS SRV lookup failed/);
});

test('redacts MongoDB credentials in ordinary connection errors', () => {
  const output = describeMongoConnectionError(
    new Error('Could not connect to mongodb://alice:secret@db.example.net:27017/devfolio')
  );
  assert.doesNotMatch(output, /alice|secret/);
  assert.match(output, /\[redacted MongoDB URI\]/);
});

test('does not label ordinary authentication failures as DNS failures', () => {
  const output = describeMongoConnectionError(
    new Error('Authentication failed'),
    'mongodb+srv://cluster.example.net/devfolio'
  );
  assert.match(output, /Authentication failed/);
  assert.doesNotMatch(output, /DNS SRV lookup failed/);
});
