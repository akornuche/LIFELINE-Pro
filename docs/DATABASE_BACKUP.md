# Database Backup Guide

> **Last Updated**: 2025-11-25  
> **Database**: PostgreSQL (Production), SQLite (Development)

---

## Overview

LifeLine Pro uses different database configurations for development and production:

| Environment | Database | Backup Strategy |
|-------------|----------|-----------------|
| Development | SQLite | Manual copy of `.sqlite` file |
| Production | PostgreSQL | Automated with pg_dump |

---

## Production PostgreSQL Backup

### Automated Backup Script

The following cron job runs daily at 2:00 AM to create a compressed backup:

```bash
# Add to crontab for automated backups
0 2 * * * /path/to/lifeline-pro/scripts/backup.sh >> /var/log/db-backup.log 2>&1
```

### Backup Script (`scripts/backup.sh`)

```bash
#!/bin/bash

# Configuration
DB_NAME=${DB_NAME:-lifeline_pro_prod}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
BACKUP_DIR=${BACKUP_DIR:-/var/backups/lifeline}
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="lifeline_pro_${DATE}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Create backup with compression
pg_dump -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} | gzip > ${BACKUP_DIR}/${BACKUP_FILE}

# Set permissions
chmod 600 ${BACKUP_DIR}/${BACKUP_FILE}

# Keep only 30 days of backups
find ${BACKUP_DIR} -name "lifeline_pro_*.sql.gz" -mtime +30 -delete

# Log success
echo "$(date): Backup completed - ${BACKUP_DIR}/${BACKUP_FILE}"

# Optional: Sync to cloud storage
# aws s3 cp ${BACKUP_DIR}/${BACKUP_FILE} s3://your-backup-bucket/
```

### Restore from Backup

```bash
# Restore compressed backup
gunzip -c /path/to/backup.sql.gz | psql -U postgres -d lifeline_pro_prod

# Or without compression
psql -U postgres -d lifeline_pro_prod < /path/to/backup.sql
```

### Backup Verification

```bash
# Check backup file size
ls -lh /var/backups/lifeline/

# Verify backup integrity
gunzip -t /var/backups/lifeline/lifeline_pro_YYYYMMDD_HHMMSS.sql.gz && echo "Backup OK"

# Test restore in staging
psql -U postgres -d lifeline_pro_staging < /path/to/backup.sql
```

---

## Development SQLite Backup

### Manual Backup

SQLite databases are single files, making backups simple:

```bash
# Copy the database file
cp backend/data/lifeline.db backend/data/lifeline.db.backup

# Or with timestamp
cp backend/data/lifeline.db "backend/data/lifeline.db.$(date +%Y%m%d_%H%M%S)"
```

### Restore from Backup

```bash
# Restore from backup
cp backend/data/lifeline.db.backup backend/data/lifeline.db
```

---

## Cloud Storage Integration

### AWS S3 Backup (Recommended)

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Add to backup script
aws s3 cp ${BACKUP_DIR}/${BACKUP_FILE} s3://your-backup-bucket/db-backups/
```

### Azure Blob Storage

```bash
# Install Azure CLI
az login

# Upload to blob storage
az storage blob upload \
  --account-name youraccount \
  --container-name backups \
  --name db-backups/${BACKUP_FILE} \
  --file ${BACKUP_DIR}/${BACKUP_FILE}
```

---

## Backup Schedule

| Backup Type | Frequency | Retention | Schedule |
|-------------|-----------|-----------|----------|
| Full Backup | Daily | 30 days | 2:00 AM |
| Transaction Log | Every 15 min | 7 days | Every 15 min |
| Weekly Full | Weekly | 90 days | Sunday 3:00 AM |

---

## Monitoring

### Backup Health Check

```bash
# Check if backup is running
pgrep -f pg_dump

# Check backup file age
find /var/backups/lifeline -name "*.sql.gz" -mtime +1 | wc -l

# Alert if no backup found in 24 hours
if [ $(find /var/backups/lifeline -name "*.sql.gz" -mtime +1 | wc -l) -gt 0 ]; then
  echo "WARNING: No recent backup found!"
fi
```

---

## Disaster Recovery

### RPO (Recovery Point Objective)
- **Maximum data loss**: 15 minutes (transaction log backup interval)

### RTO (Recovery Time Objective)
- **Full restore time**: < 30 minutes
- **Point-in-time restore**: < 15 minutes

### Recovery Steps

1. **Identify recovery point** - Choose backup timestamp
2. **Restore base backup**
3. **Apply transaction logs** (if needed)
4. **Verify data integrity**
5. **Restart application**

---

## Security

### Backup Encryption

```bash
# Encrypt backup before storage
gpg --symmetric --cipher-algo AES256 ${BACKUP_FILE}
```

### Access Control

```bash
# Backup directory permissions
chmod 700 /var/backups/lifeline
chown postgres:postgres /var/backups/lifeline
```

---

## Testing

### Monthly Recovery Test

```bash
# Create a test database
createdb lifeline_pro_test_restore

# Restore latest backup
gunzip -c /var/backups/lifeline/$(ls -t /var/backups/lifeline | head -1) | \
  psql -U postgres -d lifeline_pro_test_restore

# Verify data
psql -d lifeline_pro_test_restore -c "SELECT COUNT(*) FROM users"
```

---

## Notes

- Always test backup restoration in staging before relying on backups
- Monitor backup job status via logs
- Keep backup verification in your CI/CD pipeline
- Consider using WAL-G for continuous archiving

---

**Last Updated**: 2025-11-25
