const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { Client, Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ quiet: true });

const databaseName = `ml_workflows_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
};
const appRoot = process.cwd();
let databaseCreated = false;
let apiProcess;
let workflowPool;
let baseUrl;
let accessToken;
let apiLogs = '';
const filesCreatedByTest = new Set();

async function getAvailablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function expectStatus(method, route, body, expectedStatus = 200, authenticated = true) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(authenticated && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    data = responseText;
  }
  assert.equal(response.status, expectedStatus, `${method} ${route} returned ${response.status}; expected ${expectedStatus}: ${responseText.slice(0, 500)}`);
  console.log(`${method} ${route} -> ${response.status}`);
  return data;
}

async function expectMultipart(route, form, expectedStatus = 201, authenticated = true) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: 'POST',
    headers: authenticated && accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
  });
  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    data = responseText;
  }
  assert.equal(response.status, expectedStatus, `POST ${route} returned ${response.status}; expected ${expectedStatus}: ${responseText.slice(0, 500)}`);
  console.log(`POST ${route} -> ${response.status}`);
  return data;
}

function imageForm(fieldName, filename, mimeType = 'image/png') {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p3sAAAAASUVORK5CYII=', 'base64');
  const form = new FormData();
  form.append(fieldName, new Blob([png], { type: mimeType }), filename);
  return form;
}

function entityId(entity) {
  const id = Number(entity?.id);
  assert.ok(Number.isInteger(id) && id > 0, 'Expected a created entity to return its id');
  return id;
}

async function createIsolatedDatabase() {
  const adminClient = new Client({ ...pgConfig, database: process.env.DB_NAME || 'marketplace_literacy' });
  await adminClient.connect();
  try {
    await adminClient.query(`CREATE DATABASE ${databaseName}`);
    databaseCreated = true;
  } finally {
    await adminClient.end();
  }

  const migration = spawnSync(process.execPath, ['scripts/migrate.cjs'], {
    cwd: appRoot,
    env: { ...process.env, DB_NAME: databaseName },
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  if (migration.status !== 0) {
    throw new Error(`Isolated database migration failed: ${(migration.stderr || migration.stdout).slice(-1800)}`);
  }
  console.log('Fresh database migrations applied.');

  workflowPool = new Pool({ ...pgConfig, database: databaseName });
  const passwordHash = await bcrypt.hash('workflow-integration-password', 4);
  await workflowPool.query(
    'INSERT INTO admin_users (username, password_hash, email, name) VALUES ($1, $2, $3, $4)',
    ['workflow-admin', passwordHash, 'workflow-admin@example.test', 'Workflow Admin'],
  );
}

async function startApi() {
  const port = await getAvailablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  apiProcess = spawn(process.execPath, ['dist/main.js'], {
    cwd: appRoot,
    env: { ...process.env, DB_NAME: databaseName, PORT: String(port), API_BASE_URL: baseUrl },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  apiProcess.stdout.on('data', (chunk) => { apiLogs = `${apiLogs}${chunk}`.slice(-12000); });
  apiProcess.stderr.on('data', (chunk) => { apiLogs = `${apiLogs}${chunk}`.slice(-12000); });

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (apiProcess.exitCode !== null) throw new Error(`API exited during startup with code ${apiProcess.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.status === 200) {
        const result = await response.json();
        assert.equal(result.database, 'connected');
        console.log('GET /api/health -> 200 (database connected)');
        const swagger = await fetch(`${baseUrl}/api`);
        assert.equal(swagger.status, 200, 'Swagger UI should be served at /api');
        assert.match(await swagger.text(), /swagger/i);
        console.log('GET /api -> 200 (Swagger UI)');
        return;
      }
    } catch {
      // The server can refuse connections while Nest is still initializing.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('API did not become ready on the isolated database');
}

async function verifyWorkflows() {
  const login = await expectStatus('POST', '/api/admin/login', {
    username: 'workflow-admin', password: 'workflow-integration-password',
  }, 200, false);
  assert.ok(login.token, 'Login should issue an access token');
  accessToken = login.token;

  await expectStatus('GET', '/api/dashboard/summary', undefined, 401, false);
  const adminList = await expectStatus('GET', '/api/admin/all');
  assert.equal(adminList.length, 1);

  const secondAdmin = await expectStatus('POST', '/api/admin/create', {
    username: 'workflow-secondary',
    password: 'secondary-workflow-password',
    name: 'Secondary Admin',
    email: 'workflow-secondary@example.test',
  }, 201);
  const secondAdminId = entityId(secondAdmin);
  await expectStatus('GET', `/api/admin/${secondAdminId}`);
  await expectStatus('POST', '/api/admin/reset-user-password', {
    userId: secondAdminId, newPassword: 'reset-workflow-password',
  }, 200);
  const secondaryLogin = await expectStatus('POST', '/api/admin/login', {
    username: 'workflow-secondary', password: 'reset-workflow-password',
  }, 200, false);
  assert.ok(secondaryLogin.token);
  await expectStatus('POST', '/api/admin/change-password-public', {
    username: 'workflow-secondary', currentPassword: 'reset-workflow-password',
    newPassword: 'public-change-workflow-password',
  }, 200, false);
  const publicPasswordLogin = await expectStatus('POST', '/api/admin/login', {
    username: 'workflow-secondary', password: 'public-change-workflow-password',
  }, 200, false);
  assert.ok(publicPasswordLogin.token);

  await expectStatus('POST', '/api/admin/change-password', {
    currentPassword: 'incorrect-current-password', newPassword: 'primary-change-workflow-password',
  }, 400);
  await expectStatus('POST', '/api/admin/change-password', {
    currentPassword: 'workflow-integration-password', newPassword: 'primary-change-workflow-password',
  }, 200);
  const updatedPrimaryLogin = await expectStatus('POST', '/api/admin/login', {
    username: 'workflow-admin', password: 'primary-change-workflow-password',
  }, 200, false);
  accessToken = updatedPrimaryLogin.token;

  const subject = await expectStatus('POST', '/api/subjects', {
    name: 'Workflow Literacy', description: 'Integration test subject',
  }, 201);
  const subjectId = entityId(subject);
  const searchedSubjects = await expectStatus('GET', '/api/subjects?search=Workflow&page=1&limit=1000');
  assert.ok(searchedSubjects.some((entry) => Number(entry.id) === subjectId));
  await expectStatus('GET', `/api/subjects/${subjectId}`);
  await expectStatus('GET', `/api/subjects/${subjectId}/stats`);
  await expectStatus('PUT', `/api/subjects/${subjectId}`, { description: 'Updated description' });

  const location = await expectStatus('POST', '/api/locations', {
    village: 'Flow Village', block: 'Flow Block', district: 'Flow District',
    state: 'Chhattisgarh', pincode: '490001', latitude: 21.25, longitude: 81.63,
    district_cd: 700001, block_cd: 700002,
  }, 201);
  const locationId = entityId(location);
  await expectStatus('GET', '/api/locations?district=Flow&district_cd=700001&block_cd=700002&page=1&limit=1000');
  await expectStatus('GET', `/api/locations/${locationId}`);
  await expectStatus('GET', `/api/locations/${locationId}/stats`);
  await expectStatus('PUT', `/api/locations/${locationId}`, { village: 'Flow Village Updated' });

  const trainer = await expectStatus('POST', '/api/trainers', {
    name: 'Workflow Trainer', email: 'workflow-trainer@example.test',
    phone: '9876543210', bio: 'Created for workflow verification',
  }, 201);
  const trainerId = entityId(trainer);
  await expectStatus('GET', '/api/trainers?search=Workflow&page=1&limit=1000');
  await expectStatus('GET', `/api/trainers/${trainerId}`);
  await expectStatus('PUT', `/api/trainers/${trainerId}`, { bio: 'Updated workflow trainer' });
  const trainerImage = await expectMultipart(`/api/trainers/${trainerId}/upload-photo`, imageForm('image', 'workflow.png'));
  assert.ok(trainerImage.file_url);
  filesCreatedByTest.add(path.resolve(appRoot, 'uploads', 'trainer', trainerImage.file_name));
  await expectStatus('GET', `/api/trainers/${trainerId}`);
  const trainerGallery = await expectStatus('GET', '/api/public/gallery/trainers?page=1&limit=50', undefined, 200, false);
  assert.ok(trainerGallery.data.some((entry) => entry.url === trainerImage.file_url));

  const training = await expectStatus('POST', '/api/trainings', {
    trainer_id: trainerId, subject_id: subjectId, location_id: locationId,
    start_date: '2026-11-17T09:00:00.000Z', end_date: '2026-11-17T17:00:00.000Z',
    max_participants: 10, status: 'scheduled', training_type: 'Pilot Phase I',
  }, 201);
  const trainingId = entityId(training);
  await expectStatus('GET', '/api/trainings?limit=20');
  await expectStatus('GET', `/api/trainings/${trainingId}`);
  await expectStatus('GET', `/api/trainings/${trainingId}/details`);
  await expectStatus('PUT', `/api/trainings/${trainingId}`, { status: 'ongoing' });

  const participant = await expectStatus('POST', '/api/participants', {
    training_id: trainingId, name: 'Workflow Participant', phone: '9123456780',
    age: 30, caste: 'OBC', education: 'Graduate', category: 'Women', attendance_status: 'present',
  }, 201);
  const participantId = entityId(participant);
  await expectStatus('POST', '/api/participants', {
    training_id: trainingId, name: 'Duplicate Phone', phone: '9123456780',
  }, 400);
  await expectStatus('POST', '/api/participants', {
    training_id: trainingId, name: 'Invalid Age', age: 9,
  }, 400);
  await expectStatus('GET', `/api/participants?training_id=${trainingId}&page=1&limit=50000`);
  await expectStatus('GET', `/api/participants/${participantId}`);
  await expectStatus('GET', `/api/participants/${participantId}/details`);
  await expectStatus('PUT', `/api/participants/${participantId}`, {
    name: 'Workflow Participant Updated', attendance_status: 'late',
  });

  await expectStatus('DELETE', `/api/trainings/${trainingId}`, undefined, 400);
  await expectStatus('DELETE', `/api/subjects/${subjectId}`, undefined, 400);
  await expectStatus('DELETE', `/api/locations/${locationId}`, undefined, 400);
  await expectStatus('GET', '/api/dashboard/summary?district_cd=700001&block_cd=700002&start_date=2026-11-17&end_date=2026-11-17');
  await expectStatus('GET', '/api/dashboard/training-stats?district_cd=700001&block_cd=700002');
  await expectStatus('GET', '/api/dashboard/participant-stats?district_cd=700001&block_cd=700002');
  await expectStatus('GET', '/api/dashboard/complete');
  await expectStatus('GET', '/api/reports/districts');
  await expectStatus('GET', '/api/reports/blocks?district_cd=700001');
  await expectStatus('GET', '/api/reports/dashboard?district_cd=700001&block_cd=700002');
  await expectStatus('GET', '/api/public/districts', undefined, 200, false);
  await expectStatus('GET', '/api/public/trainings', undefined, 200, false);

  const unauthorizedUpload = await expectMultipart('/api/files/upload', imageForm('file', 'unauthorized.png'), 401, false);
  assert.equal(unauthorizedUpload.message, 'Authentication required');
  await expectMultipart('/api/files/upload', imageForm('file', 'invalid.txt', 'text/plain'), 400);
  const uploaded = await expectMultipart('/api/files/upload', imageForm('file', 'workflow.png'));
  assert.ok(uploaded.file_name && uploaded.file_url);
  const uploadedPath = path.resolve(appRoot, 'uploads', uploaded.file_name);
  filesCreatedByTest.add(uploadedPath);
  const download = await fetch(`${baseUrl}/api/files/${encodeURIComponent(uploaded.file_name)}`);
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-type'), 'application/octet-stream');
  console.log(`GET /api/files/${uploaded.file_name} -> ${download.status}`);

  const multipleForm = imageForm('files', 'workflow-a.png');
  multipleForm.append('files', imageForm('files', 'workflow-b.png').get('files'));
  const multipleUploads = await expectMultipart('/api/files/upload-multiple', multipleForm);
  assert.equal(multipleUploads.length, 2);
  for (const uploadedFile of multipleUploads) {
    filesCreatedByTest.add(path.resolve(appRoot, 'uploads', uploadedFile.file_name));
    await expectStatus('DELETE', `/api/files/delete?file_url=${encodeURIComponent(uploadedFile.file_url)}`, undefined, 200);
  }
  await expectStatus('DELETE', `/api/files/delete?file_url=${encodeURIComponent(uploaded.file_url)}`, undefined, 200);
  filesCreatedByTest.delete(uploadedPath);
  const missingFile = await fetch(`${baseUrl}/api/files/${encodeURIComponent(uploaded.file_name)}`);
  assert.equal(missingFile.status, 404);
  console.log(`GET /api/files/${uploaded.file_name} after deletion -> ${missingFile.status}`);
  await expectStatus('DELETE', `/api/files/delete?file_url=${encodeURIComponent(trainerImage.file_url)}`, undefined, 200);
  filesCreatedByTest.delete(path.resolve(appRoot, 'uploads', 'trainer', trainerImage.file_name));

  await expectStatus('DELETE', `/api/participants/${participantId}`, undefined, 204);
  await expectStatus('DELETE', `/api/trainings/${trainingId}`, undefined, 204);
  await expectStatus('DELETE', `/api/trainers/${trainerId}`, undefined, 204);
  await expectStatus('DELETE', `/api/subjects/${subjectId}`, undefined, 204);
  await expectStatus('DELETE', `/api/locations/${locationId}`, undefined, 204);
  console.log('Admin, subject, location, trainer, training, participant, upload, dashboard, and report workflows passed.');
}

async function cleanup() {
  if (apiProcess && apiProcess.exitCode === null) {
    apiProcess.kill();
    await Promise.race([
      new Promise((resolve) => apiProcess.once('exit', resolve)),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  }
  for (const filePath of filesCreatedByTest) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  if (workflowPool) await workflowPool.end().catch(() => {});
  if (!databaseCreated) return;

  const adminClient = new Client({ ...pgConfig, database: process.env.DB_NAME || 'marketplace_literacy' });
  try {
    await adminClient.connect();
    await adminClient.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [databaseName],
    );
    await adminClient.query(`DROP DATABASE ${databaseName}`);
    console.log('Temporary workflow database removed.');
  } finally {
    await adminClient.end();
  }
}

(async () => {
  try {
    await createIsolatedDatabase();
    await startApi();
    await verifyWorkflows();
  } catch (error) {
    console.error(error.message);
    if (apiLogs) console.error(`API diagnostic output:\n${apiLogs.slice(-5000)}`);
    process.exitCode = 1;
  } finally {
    try {
      await cleanup();
    } catch (error) {
      console.error(`Workflow cleanup failed: ${error.code || error.message}`);
      process.exitCode = 1;
    }
  }
})();
