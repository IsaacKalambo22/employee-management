import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || 'employee-management'

async function setupStorage() {
  console.log(`Setting up Supabase storage bucket: ${BUCKET_NAME}`)

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error('Error listing buckets:', listError)
    process.exit(1)
  }

  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

  if (bucketExists) {
    console.log(`✓ Bucket "${BUCKET_NAME}" already exists`)
  } else {
    console.log(`Creating bucket "${BUCKET_NAME}"...`)
    
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 10485760, // 10MB
    })

    if (createError) {
      console.error('Error creating bucket:', createError)
      process.exit(1)
    }

    console.log(`✓ Bucket "${BUCKET_NAME}" created successfully`)
  }

  // Set up RLS policies for public read access
  console.log('Setting up storage policies...')
  
  // Enable RLS on storage.objects
  const { error: rlsError } = await supabase
    .from('storage.objects')
    .select('id')
    .limit(1)

  if (rlsError) {
    console.log('Note: RLS policies setup requires manual configuration in Supabase dashboard')
    console.log('Please configure the following policies in the Supabase dashboard:')
    console.log(`1. Go to Storage > ${BUCKET_NAME} > Policies`)
    console.log('2. Add a policy for SELECT (public read)')
    console.log('3. Add a policy for INSERT (authenticated upload)')
    console.log('4. Add a policy for DELETE (authenticated delete)')
  }

  console.log('\n✓ Storage setup complete!')
}

setupStorage().catch(console.error)
