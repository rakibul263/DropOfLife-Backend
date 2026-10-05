import prisma from '../app/shared/prisma';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const jsonPath = path.join(__dirname, '../data/scraped_donors.json');
const scrapedDonors = fs.existsSync(jsonPath)
  ? JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  : [];

const districtToDivision: Record<string, string> = {
  'ঢাকা': 'Dhaka',
  'গাজীপুর': 'Dhaka',
  'নারায়াণগঞ্জ': 'Dhaka',
  'নারায়ণগঞ্জ': 'Dhaka',
  'টাঙ্গাইল': 'Dhaka',
  'কিশোরগঞ্জ': 'Dhaka',
  'মানিকগঞ্জ': 'Dhaka',
  'মুন্সীগঞ্জ': 'Dhaka',
  'নরসিংদী': 'Dhaka',
  'ফরিদপুর': 'Dhaka',
  'গোপালগঞ্জ': 'Dhaka',
  'মাদারীপুর': 'Dhaka',
  'রাজবাড়ী': 'Dhaka',
  'শরীয়তপুর': 'Dhaka',

  'চট্টগ্রাম': 'Chattogram',
  'কক্সবাজার': 'Chattogram',
  'কুমিল্লা': 'Chattogram',
  'ফেনী': 'Chattogram',
  'ব্রাহ্মণবাড়িয়া': 'Chattogram',
  'চাঁদপুর': 'Chattogram',
  'নোয়াখালী': 'Chattogram',
  'নোয়াখালী': 'Chattogram',
  'লক্ষ্মীপুর': 'Chattogram',
  'খাগড়াছড়ি': 'Chattogram',
  'রাঙ্গামাটি': 'Chattogram',
  'বান্দরবান': 'Chattogram',

  'রাজশাহী': 'Rajshahi',
  'বগুড়া': 'Rajshahi',
  'পাবনা': 'Rajshahi',
  'সিরাজগঞ্জ': 'Rajshahi',
  'নওগাঁ': 'Rajshahi',
  'নাটোর': 'Rajshahi',
  'চাঁপাইনবাবগঞ্জ': 'Rajshahi',
  'জয়পুরহাট': 'Rajshahi',

  'খুলনা': 'Khulna',
  'সাতক্ষীরা': 'Khulna',
  'ঝিনাইদহ': 'Khulna',
  'মাগুরা': 'Khulna',
  'কুষ্টিয়া': 'Khulna',
  'মেহেরপুর': 'Khulna',
  'চুয়াডাঙ্গা': 'Khulna',
  'বাগেরহাট': 'Khulna',
  'নড়াইল': 'Khulna',
  'যশোর': 'Khulna',

  'বরিশাল': 'Barishal',
  'ভোলা': 'Barishal',
  'পটুয়াখালী': 'Barishal',
  'পিরোজপুর': 'Barishal',
  'বরগুনা': 'Barishal',
  'ঝালকাঠি': 'Barishal',

  'সিলেট': 'Sylhet',
  'হবিগঞ্জ': 'Sylhet',
  'সুনামগঞ্জ': 'Sylhet',
  'মৌলভীবাজার': 'Sylhet',

  'রংপুর': 'Rangpur',
  'পঞ্চগড়': 'Rangpur',
  'ঠাকুরগাঁও': 'Rangpur',
  'দিনাজপুর': 'Rangpur',
  'নীলফামারী': 'Rangpur',
  'কুড়িগ্রাম': 'Rangpur',
  'লালমনিরহাট': 'Rangpur',
  'গাইবান্ধা': 'Rangpur',
  'উত্তর দিনাজপুর': 'Rangpur',

  'ময়মনসিংহ': 'Mymensingh',
  'জামালপুর': 'Mymensingh',
  'নেত্রকোণা': 'Mymensingh',
  'শেরপুর': 'Mymensingh',
};

const bengaliToEnglish: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

function parseBengaliNumber(str: string): string {
  return str.replace(/[০-৯]/g, (ch) => bengaliToEnglish[ch] || ch);
}

function extractDonations(note: string | null, donorId: string): number {
  if (note) {
    const normalized = parseBengaliNumber(note);
    const match = normalized.match(/(\d+)\s*(?:তম|বার)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0 && num < 100) return num;
    }
  }
  const idNum = parseInt(donorId, 10) || 1;
  return (idNum % 6) + 1;
}

function cleanPhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+88')) return digits;
  if (digits.startsWith('01')) return '+88' + digits;
  if (digits.startsWith('1')) return '+880' + digits;
  return digits.length === 11 ? '+88' + digits : '+880' + digits;
}

export async function runSeed() {
  console.log('🌱 Starting Neon PostgreSQL Data Cleanse & Seeding...');

  try {
    await prisma.$connect();
    console.log('✅ Connected to Neon PostgreSQL database.');

    // 1. Purge all existing data completely
    console.log('🧹 Purging all existing database records...');
    await prisma.review.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.bloodRequest.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.camp.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.user.deleteMany();
    console.log('✨ All existing records successfully wiped clean.');

    // 2. Insert Default Admin: Rakibul hasan (rakibul@dropoflife.com / admin123)
    console.log('👑 Seeding Default Admin (Rakibul hasan)...');
    const adminHashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
      data: {
        name: 'Rakibul hasan',
        email: 'rakibul@dropoflife.com',
        password: adminHashedPassword,
        role: 'admin',
        phone: '+8801521711716',
        isVerified: true,
        isAvailable: false,
        isSuspended: false,
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Mirpur',
        totalDonations: 12,
        note: 'DropOfLife System Administrator & Chief Coordinator',
      },
    });
    console.log(`✅ Default Admin created: ${adminUser.name} (${adminUser.email})`);

    // 2.1 Insert Default Donor: Rakibul Hasan (rakibulhasan@gmail.com / 123456)
    console.log('🩸 Seeding Default Donor (Rakibul Hasan)...');
    const donorHashedPassword = await bcrypt.hash('123456', 10);
    const donorUser = await prisma.user.create({
      data: {
        name: 'Rakibul Hasan (Donor)',
        email: 'rakibulhasan@gmail.com',
        password: donorHashedPassword,
        role: 'donor',
        phone: '+8801521711716',
        bloodGroup: 'O+',
        gender: 'Male',
        hasDonatedBefore: true,
        isAvailable: true,
        isVerified: true,
        isSuspended: false,
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Mirpur-10',
        totalDonations: 6,
        note: 'জরুরি প্রয়োজনে যেকোনো সময় রক্তদানে প্রস্তুত। রোগীর সংকটে নিঃসংকোচে কল করুন।',
      },
    });
    console.log(`✅ Default Donor created: ${donorUser.name} (${donorUser.email})`);

    // 2.2 Insert Default Hospital / Provider: Dhaka Central Blood Bank & Hospital (hospital@dropoflife.org / 123456)
    console.log('🏥 Seeding Default Hospital (Dhaka Central Blood Bank & Hospital)...');
    const hospitalHashedPassword = await bcrypt.hash('123456', 10);
    const hospitalUser = await prisma.user.create({
      data: {
        name: 'Dhaka Central Blood Bank & Hospital',
        email: 'hospital@dropoflife.org',
        password: hospitalHashedPassword,
        role: 'provider',
        phone: '+8801521711716',
        organizationName: 'Dhaka Central Blood Bank & Hospital',
        licenseNumber: 'DGHS-BB-2024-984',
        isVerified: true,
        isAvailable: true,
        isSuspended: false,
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Dhanmondi',
        totalDonations: 450,
        note: 'Official Blood Bank and Transfusion Service Partner',
      },
    });
    console.log(`✅ Default Hospital created: ${hospitalUser.name} (${hospitalUser.email})`);

    // 2.3 Legacy aliases for seamless compatibility
    const legacyAdminPass = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({
      data: {
        name: 'DropOfLife Super Admin',
        email: 'admin@dropoflife.org',
        password: legacyAdminPass,
        role: 'admin',
        phone: '+8801521711716',
        isVerified: true,
        isAvailable: false,
        division: 'Dhaka',
        district: 'Dhaka',
      },
    });

    const legacyDonorPass = await bcrypt.hash('Donor@123', 10);
    await prisma.user.create({
      data: {
        name: 'Tanvir Hossain (Lifesaver Donor)',
        email: 'donor@dropoflife.org',
        password: legacyDonorPass,
        role: 'donor',
        phone: '+8801521711716',
        bloodGroup: 'O+',
        isVerified: true,
        isAvailable: true,
        division: 'Dhaka',
        district: 'Dhaka',
      },
    });

    // 3. Prepare and Insert All 254 Scraped Donors
    console.log(`🩸 Processing ${scrapedDonors.length} scraped donors...`);
    const scrapedDonorHashedPassword = await bcrypt.hash('admin123', 10);

    const donorsData = scrapedDonors.map((d: any) => {
      const division = districtToDivision[d.district] || 'Dhaka';
      const totalDonations = extractDonations(d.note, d.donor_id);
      const phone = cleanPhone(d.phone || d.call_link || '01700000000');
      const lastDonationDate = d.last_donation_date ? new Date(d.last_donation_date) : null;
      const isAvailable = d.is_profile_public !== false;

      return {
        name: d.name,
        email: `donor_${d.donor_id}@dropoflife.org`,
        password: scrapedDonorHashedPassword,
        role: 'donor',
        phone,
        bloodGroup: d.blood_group,
        gender: 'Male',
        hasDonatedBefore: true,
        isAvailable,
        lastDonationDate,
        division,
        district: d.district,
        upazila: d.address && d.address !== '-' ? d.address.slice(0, 100) : d.district,
        isVerified: true,
        isSuspended: false,
        totalDonations,
        note: d.note || null,
      };
    });

    console.log('💾 Inserting donors into Neon PostgreSQL...');
    const result = await prisma.user.createMany({
      data: donorsData,
      skipDuplicates: true,
    });
    console.log(`🎉 Successfully inserted ${result.count} verified donors into Neon PostgreSQL!`);

    const totalUsers = await prisma.user.count();
    console.log(`📊 Total Users in Neon PostgreSQL: ${totalUsers}`);
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('🚀 Seeding script completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failure:', err);
      process.exit(1);
    });
}
