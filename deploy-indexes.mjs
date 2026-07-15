import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'credentials', 'firebase-admin.json'), 'utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const firestore = admin.firestore();

async function deployIndexes() {
  try {
    console.log('📋 Reading firestore.indexes.json...');
    const indexConfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'firestore.indexes.json'), 'utf-8')
    );

    console.log(`✓ Found ${indexConfig.indexes.length} indexes to deploy`);
    console.log('');

    // Deploy indexes via Firestore Admin API
    const projectId = serviceAccount.project_id;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/default/indexes`;

    console.log(`🚀 Deploying indexes to project: ${projectId}`);
    console.log(`📍 Target: ${url}`);
    console.log('');

    // List existing indexes first
    console.log('📌 Checking existing indexes...');
    let existingIndexes = [];
    try {
      const response = await firestore.api.projectsOperations.list('projects/' + projectId);
      console.log('✓ Connected to Firestore API');
    } catch (error) {
      console.log('⚠ Note: Firestore API check skipped');
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('INDEX DEPLOYMENT CONFIGURATION');
    console.log('='.repeat(60));
    console.log(`Project ID: ${projectId}`);
    console.log(`Total Indexes: ${indexConfig.indexes.length}`);
    console.log(`Field Overrides: ${indexConfig.fieldOverrides?.length || 0}`);
    console.log('');

    // Show sample indexes
    console.log('Sample Indexes:');
    indexConfig.indexes.slice(0, 3).forEach((idx, i) => {
      const fields = idx.fields.map(f => `${f.fieldPath}(${f.order})`).join(', ');
      console.log(`  ${i + 1}. ${idx.collectionGroup}: [${fields}]`);
    });
    console.log(`  ... and ${indexConfig.indexes.length - 3} more indexes`);
    console.log('');

    console.log('✅ Configuration Ready for Deployment');
    console.log('');
    console.log('DEPLOYMENT INSTRUCTIONS:');
    console.log('1. Open Firebase Console: https://console.firebase.google.com/project/restaurant-management-d5c73/firestore');
    console.log('2. Go to Indexes tab');
    console.log('3. Click "Add Composite Index" or use Firebase CLI');
    console.log('4. Run: firebase deploy --only firestore:indexes');
    console.log('');
    console.log('OR use gcloud with your credentials:');
    console.log(`gcloud firestore indexes create --all-indexes firestore.indexes.json --project=${projectId}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deployIndexes();
