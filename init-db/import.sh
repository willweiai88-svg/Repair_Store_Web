#!/bin/bash

echo "⚡ [MAINFRAME SYSTEM INITIALIZATION]: Booting database data-seeding sequence..."

# 1. Seed Core Catalog Matrix Services
mongoimport --host localhost --db sim_mobile_db --collection services --type json --file /docker-entrypoint-initdb.d/services.json --jsonArray

# 2. Seed Administrative Credentials
mongoimport --host localhost --db sim_mobile_db --collection admins --type json --file /docker-entrypoint-initdb.d/admin.json --jsonArray

# 3. Seed Registered Pro Member Nodes
mongoimport --host localhost --db sim_mobile_db --collection users --type json --file /docker-entrypoint-initdb.d/users.json --jsonArray

# 4. Seed Standard Sample Bookings Logs Array
mongoimport --host localhost --db sim_mobile_db --collection bookings --type json --file /docker-entrypoint-initdb.d/bookings.json --jsonArray

# 5. Seed Historical Testimonials Feedbacks Flow
mongoimport --host localhost --db sim_mobile_db --collection reviews --type json --file /docker-entrypoint-initdb.d/reviews.json --jsonArray

# 6. Seed Frontline Customer Enquiries Matrix
mongoimport --host localhost --db sim_mobile_db --collection enquiries --type json --file /docker-entrypoint-initdb.d/enquiries.json --jsonArray

echo "✓ [INITIALIZATION COMPLETE]: All sandbox configuration data packets compiled successfully into Atlas cluster collections."