export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'DropOfLife REST API — জীবনের এক ফোঁটা',
    version: '1.0.0',
    description: `
### 🩸 Emergency Blood Donation & Blood Bank Coordination API

DropOfLife connects blood donors, certified healthcare providers, and emergency patients across Bangladesh.

#### 🔑 Demo Credentials for Testing (1-Click Login):
| Role | Email | Password | Scope |
|:---|:---|:---|:---|
| **Super Admin** | \`rakibul@dropoflife.com\` | \`admin123\` | Platform governance, hospital verifications, system telemetry |
| **Life Saver Donor** | \`rakibulhasan@gmail.com\` | \`123456\` | Real-time GPS availability switch, request pledges, donor ID |
| **Hospital / Blood Bank** | \`hospital@dropoflife.org\` | \`123456\` | 8-group stock telemetry, verified broadcasts, camp drives |

**24/7 National Emergency Hotline:** \`+8801521711716\`
    `,
    contact: {
      name: 'DropOfLife Emergency Support Desk',
      url: 'https://dropoflife.org',
      email: 'support@dropoflife.org',
    },
  },
  servers: [
    {
      url: 'http://localhost:5050/api/v1',
      description: 'Local Development Server (Port 5050)',
    },
    {
      url: 'https://dropoflife-api.vercel.app/api/v1',
      description: 'Cloud Production Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from `/auth/login` or `/auth/register`.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '670000000000000000000002' },
          name: { type: 'string', example: 'Tanvir Hossain' },
          email: { type: 'string', example: 'donor@dropoflife.org' },
          role: { type: 'string', enum: ['donor', 'provider', 'admin'], example: 'donor' },
          phone: { type: 'string', example: '+8801521711716' },
          bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], example: 'O+' },
          isAvailable: { type: 'boolean', example: true },
          isVerified: { type: 'boolean', example: true },
          division: { type: 'string', example: 'Dhaka' },
          district: { type: 'string', example: 'Dhaka' },
          upazila: { type: 'string', example: 'Mirpur-10' },
          totalDonations: { type: 'number', example: 6 },
        },
      },
      BloodRequest: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '671000000000000000000001' },
          requesterName: { type: 'string', example: 'Tanvir Hossain' },
          patientName: { type: 'string', example: 'Kazi Farhana' },
          bloodGroup: { type: 'string', example: 'O+' },
          unitsNeeded: { type: 'number', example: 2 },
          urgencyLevel: { type: 'string', enum: ['Critical', 'Urgent', 'Routine'], example: 'Critical' },
          hospitalName: { type: 'string', example: 'Dhaka Medical College Hospital' },
          hospitalAddress: { type: 'string', example: 'Secretariat Road, Ramna, Dhaka' },
          district: { type: 'string', example: 'Dhaka' },
          division: { type: 'string', example: 'Dhaka' },
          contactNumber: { type: 'string', example: '+8801521711716' },
          reason: { type: 'string', example: 'Emergency ICU surgery following severe blood loss.' },
          status: { type: 'string', enum: ['Pending', 'In Progress', 'Fulfilled', 'Cancelled'], example: 'In Progress' },
          matchedDonorsCount: { type: 'number', example: 3 },
          assignedDonors: {
            type: 'array',
            items: { type: 'string' },
            example: ['Tanvir Hossain'],
          },
          requiredDate: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      InventoryItem: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '672000000000000000000001' },
          providerId: { type: 'string', example: '670000000000000000000003' },
          providerName: { type: 'string', example: 'Dhaka Central Blood Bank & Hospital' },
          bloodGroup: { type: 'string', example: 'O+' },
          componentType: { type: 'string', example: 'Whole Blood' },
          unitsInStock: { type: 'number', example: 42 },
          criticalThreshold: { type: 'number', example: 12 },
          lastUpdated: { type: 'string', format: 'date-time' },
        },
      },
      BloodCamp: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '673000000000000000000001' },
          providerName: { type: 'string', example: 'Dhaka Central Blood Bank & Hospital' },
          title: { type: 'string', example: 'University of Dhaka Youth Blood Drive 2026' },
          description: { type: 'string', example: 'Free comprehensive blood grouping and screening.' },
          venueAddress: { type: 'string', example: 'Teacher-Student Centre (TSC) Auditorium, Dhaka University' },
          district: { type: 'string', example: 'Dhaka' },
          division: { type: 'string', example: 'Dhaka' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          targetUnits: { type: 'number', example: 250 },
          collectedUnits: { type: 'number', example: 85 },
          status: { type: 'string', example: 'Upcoming' },
          contactPhone: { type: 'string', example: '+8801521711716' },
          volunteersCount: { type: 'number', example: 42 },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation executed successfully' },
          data: { type: 'object' },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication & Identity', description: 'User login, registration, and profile endpoints' },
    { name: 'Donors Management', description: 'Public donor directory search and availability toggling' },
    { name: 'Emergency Blood Requests', description: 'Urgent blood requisition feed, creation, and pledges' },
    { name: 'Hospital Blood Inventory', description: 'Real-time 8-blood group stock counters and thresholds' },
    { name: 'Blood Camps & Drives', description: 'Community outreach campaigns and volunteer registration' },
    { name: 'Stripe Payments', description: 'Stripe Test Mode payment intents and confirmation receipts' },
    { name: 'Super Admin Governance', description: 'Platform analytics, verification desk, and moderation' },
    { name: 'System Health', description: 'API uptime and operational heartbeat' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System Health'],
        summary: 'Check API service health and status',
        responses: {
          200: {
            description: 'API is healthy and operational',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    platform: { type: 'string', example: 'DropOfLife REST API' },
                    version: { type: 'string', example: '1.0.0' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication & Identity'],
        summary: 'Register a new Donor or Hospital Provider account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Tanvir Ahmed' },
                  email: { type: 'string', example: 'tanvir@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                  role: { type: 'string', enum: ['donor', 'provider'], default: 'donor', example: 'donor' },
                  phone: { type: 'string', example: '+8801521711716' },
                  bloodGroup: { type: 'string', example: 'O+' },
                  division: { type: 'string', example: 'Dhaka' },
                  district: { type: 'string', example: 'Dhaka' },
                  upazila: { type: 'string', example: 'Mirpur' },
                  organizationName: { type: 'string', example: 'City Blood Bank' },
                  licenseNumber: { type: 'string', example: 'DGHS-BB-2026-99' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Account registered successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Missing required fields' },
          409: { description: 'User with this email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication & Identity'],
        summary: 'User Login (Supports 1-Click Role Login)',
        description: 'Authenticates user and returns JWT bearer token + safe user object.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@dropoflife.org' },
                  password: { type: 'string', example: 'Admin@123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication & Identity'],
        summary: 'Get current authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Profile retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized / Missing JWT' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication & Identity'],
        summary: 'Clear authentication session',
        responses: {
          200: {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Logged out successfully' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/donors': {
      get: {
        tags: ['Donors Management'],
        summary: 'Public Search Donors with filters',
        parameters: [
          { name: 'bloodGroup', in: 'query', schema: { type: 'string' }, description: 'e.g. O+, A+, B-, AB-' },
          { name: 'division', in: 'query', schema: { type: 'string' }, description: 'e.g. Dhaka, Chattogram' },
          { name: 'district', in: 'query', schema: { type: 'string' }, description: 'e.g. Dhaka, Rajshahi' },
          { name: 'isAvailable', in: 'query', schema: { type: 'boolean' }, description: 'true = active availability beacon only' },
        ],
        responses: {
          200: {
            description: 'Filtered list of donors',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'number', example: 4 },
                        donors: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/donors/availability': {
      patch: {
        tags: ['Donors Management'],
        summary: 'Toggle real-time GPS donation availability status',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isAvailable'],
                properties: {
                  isAvailable: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Availability status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Donor availability updated to Available' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/requests': {
      get: {
        tags: ['Emergency Blood Requests'],
        summary: 'Get all emergency blood requisitions (Urgency Feed)',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'In Progress', 'Fulfilled'] } },
          { name: 'bloodGroup', in: 'query', schema: { type: 'string' } },
          { name: 'urgencyLevel', in: 'query', schema: { type: 'string', enum: ['Critical', 'Urgent', 'Routine'] } },
        ],
        responses: {
          200: {
            description: 'List of blood requests',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'number', example: 4 },
                        requests: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/BloodRequest' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Emergency Blood Requests'],
        summary: 'Create and broadcast an urgent blood requisition',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['patientName', 'bloodGroup', 'hospitalName', 'contactNumber'],
                properties: {
                  patientName: { type: 'string', example: 'Kazi Farhana' },
                  bloodGroup: { type: 'string', example: 'O+' },
                  unitsNeeded: { type: 'number', default: 1, example: 2 },
                  urgencyLevel: { type: 'string', enum: ['Critical', 'Urgent', 'Routine'], default: 'Urgent', example: 'Critical' },
                  hospitalName: { type: 'string', example: 'Dhaka Medical College Hospital' },
                  hospitalAddress: { type: 'string', example: 'Secretariat Road, Ramna, Dhaka' },
                  district: { type: 'string', example: 'Dhaka' },
                  division: { type: 'string', example: 'Dhaka' },
                  reason: { type: 'string', example: 'Emergency surgery after acute blood loss' },
                  contactNumber: { type: 'string', example: '+8801521711716' },
                  requiredDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Emergency blood request created and broadcasted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Emergency blood request created and broadcasted.' },
                    data: {
                      type: 'object',
                      properties: {
                        request: { $ref: '#/components/schemas/BloodRequest' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Missing required parameters' },
        },
      },
    },
    '/requests/{id}/status': {
      patch: {
        tags: ['Emergency Blood Requests'],
        summary: 'Update request status or pledge donation',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['Pending', 'In Progress', 'Fulfilled', 'Cancelled'], example: 'Fulfilled' },
                  donorName: { type: 'string', example: 'Tanvir Hossain' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Request status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Request status updated to Fulfilled' },
                    data: {
                      type: 'object',
                      properties: {
                        request: { $ref: '#/components/schemas/BloodRequest' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Request not found' },
        },
      },
    },
    '/inventory': {
      get: {
        tags: ['Hospital Blood Inventory'],
        summary: 'Get blood stock inventory levels',
        parameters: [
          { name: 'providerId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Stock inventory data for all 8 blood groups',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'number', example: 8 },
                        inventories: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/InventoryItem' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/inventory/{id}': {
      patch: {
        tags: ['Hospital Blood Inventory'],
        summary: 'Update stock units count or critical threshold',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['unitsInStock'],
                properties: {
                  unitsInStock: { type: 'number', example: 45 },
                  criticalThreshold: { type: 'number', example: 12 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Inventory unit level updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Inventory stock level updated.' },
                    data: {
                      type: 'object',
                      properties: {
                        inventory: { $ref: '#/components/schemas/InventoryItem' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Inventory record not found' },
        },
      },
    },
    '/camps': {
      get: {
        tags: ['Blood Camps & Drives'],
        summary: 'Get public calendar of blood donation camps',
        responses: {
          200: {
            description: 'List of blood camps',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'number', example: 2 },
                        camps: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/BloodCamp' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Blood Camps & Drives'],
        summary: 'Schedule and publish a new blood drive camp',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'venueAddress', 'startDate', 'endDate', 'contactPhone'],
                properties: {
                  title: { type: 'string', example: 'University of Dhaka Youth Blood Drive 2026' },
                  description: { type: 'string', example: 'Voluntary blood drive with certified doctor screening.' },
                  venueAddress: { type: 'string', example: 'TSC Auditorium, Dhaka University' },
                  district: { type: 'string', example: 'Dhaka' },
                  division: { type: 'string', example: 'Dhaka' },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                  targetUnits: { type: 'number', default: 100, example: 250 },
                  contactPhone: { type: 'string', example: '+8801521711716' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Blood camp drive successfully scheduled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Blood camp drive successfully scheduled.' },
                    data: {
                      type: 'object',
                      properties: {
                        camp: { $ref: '#/components/schemas/BloodCamp' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/camps/{id}/volunteer': {
      post: {
        tags: ['Blood Camps & Drives'],
        summary: 'Register as a voluntary worker or pledge donor for a camp',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Tanvir Hossain' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Successfully registered as volunteer',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Successfully registered as volunteer for this blood drive.' },
                    data: {
                      type: 'object',
                      properties: {
                        camp: { $ref: '#/components/schemas/BloodCamp' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Camp not found' },
        },
      },
    },
    '/payments/create-payment-intent': {
      post: {
        tags: ['Stripe Payments'],
        summary: 'Create Stripe PaymentIntent for cold-chain transport or supporter fund',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number', description: 'Amount in cents (e.g. 2500 for $25.00)', example: 2500 },
                  currency: { type: 'string', default: 'usd', example: 'usd' },
                  purpose: { type: 'string', example: 'Cold_Chain_Courier' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Stripe PaymentIntent generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    clientSecret: { type: 'string', example: 'pi_test_secret_YrKJ981...' },
                    paymentIntentId: { type: 'string', example: 'pi_test_1791128...' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/payments/confirm': {
      post: {
        tags: ['Stripe Payments'],
        summary: 'Confirm Stripe transaction and issue digital lifesaver certificate receipt',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['paymentIntentId'],
                properties: {
                  paymentIntentId: { type: 'string', example: 'pi_test_1791128...' },
                  amount: { type: 'number', example: 2500 },
                  purpose: { type: 'string', example: 'Cold_Chain_Courier' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Payment confirmed and receipt generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Payment confirmed successfully. Thank you for saving lives!' },
                    data: {
                      type: 'object',
                      properties: {
                        receipt: {
                          type: 'object',
                          properties: {
                            _id: { type: 'string', example: '674000000000000000000001' },
                            stripePaymentIntentId: { type: 'string', example: 'pi_test_1791128...' },
                            amount: { type: 'number', example: 2500 },
                            currency: { type: 'string', example: 'usd' },
                            paymentPurpose: { type: 'string', example: 'Cold_Chain_Courier' },
                            status: { type: 'string', example: 'succeeded' },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/admin/analytics': {
      get: {
        tags: ['Super Admin Governance'],
        summary: 'Get system-wide platform analytics and telemetry',
        responses: {
          200: {
            description: 'Aggregated analytics metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        stats: {
                          type: 'object',
                          properties: {
                            totalDonors: { type: 'number', example: 1420 },
                            availableDonors: { type: 'number', example: 890 },
                            totalProviders: { type: 'number', example: 36 },
                            activeRequests: { type: 'number', example: 4 },
                            fulfilledRequests: { type: 'number', example: 82 },
                            totalUnitsInStock: { type: 'number', example: 128 },
                            totalLivesSaved: { type: 'number', example: 248 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Super Admin Governance'],
        summary: 'Get all registered users / donors / providers',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['donor', 'provider', 'admin'] } },
        ],
        responses: {
          200: {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'number', example: 7 },
                        users: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          403: { description: 'Forbidden: Requires admin role' },
        },
      },
    },
    '/admin/providers/{id}/verify': {
      patch: {
        tags: ['Super Admin Governance'],
        summary: 'Verify or revoke hospital / blood bank accreditation',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isVerified'],
                properties: {
                  isVerified: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Provider accreditation status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Provider status set to Verified' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          403: { description: 'Forbidden: Requires admin role' },
          404: { description: 'Provider not found' },
        },
      },
    },
  },
};
