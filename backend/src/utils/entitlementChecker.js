import { PACKAGE_ENTITLEMENTS, SERVICE_TYPES, PACKAGE_TYPES } from '../constants/packages.js';
import logger from './logger.js';

/**
 * Package Entitlement Checker
 * Validates if a service is allowed for a specific package
 */

class EntitlementChecker {
  /**
   * Check if a service is entitled for a package
   */
  isServiceEntitled(packageType, serviceType, serviceDetails = {}) {
    try {
      const entitlements = PACKAGE_ENTITLEMENTS[packageType];

      if (!entitlements) {
        logger.error('Invalid package type', { packageType });
        return {
          entitled: false,
          reason: 'Invalid package type',
        };
      }

      switch (serviceType) {
        case SERVICE_TYPES.CONSULTATION:
          return this.checkConsultationEntitlement(entitlements, serviceDetails);

        case SERVICE_TYPES.PRESCRIPTION:
        case SERVICE_TYPES.DRUG_DISPENSING:
          return this.checkDrugEntitlement(entitlements, serviceDetails);

        case SERVICE_TYPES.MINOR_SURGERY:
          return this.checkMinorSurgeryEntitlement(entitlements, serviceDetails);

        case SERVICE_TYPES.MAJOR_SURGERY:
          return this.checkMajorSurgeryEntitlement(entitlements, serviceDetails);

        case SERVICE_TYPES.LABORATORY_TEST:
          return this.checkLabTestEntitlement(entitlements, serviceDetails);

        case SERVICE_TYPES.IMAGING:
          return this.checkImagingEntitlement(entitlements, serviceDetails);

        case SERVICE_TYPES.ADMISSION:
          return this.checkAdmissionEntitlement(entitlements, serviceDetails);

        case SERVICE_TYPES.EMERGENCY:
          return this.checkEmergencyEntitlement(entitlements, serviceDetails);

        default:
          return {
            entitled: false,
            reason: `Unknown service type: ${serviceType}`,
          };
      }
    } catch (error) {
      logger.error('Entitlement check failed', {
        packageType,
        serviceType,
        error: error.message,
      });
      return {
        entitled: false,
        reason: 'Entitlement check failed',
      };
    }
  }

  /**
   * Check consultation entitlement
   */
  checkConsultationEntitlement(entitlements, details) {
    if (!entitlements.consultations.allowed) {
      return {
        entitled: false,
        reason: 'Consultations not allowed for this package',
      };
    }

    // Check if specialty is allowed
    if (details.specialty && details.specialty !== 'general_practitioner') {
      if (!entitlements.specialists?.allowed) {
        return {
          entitled: false,
          reason: 'Specialist consultations not allowed for this package. Upgrade to Medium or Advanced.',
        };
      }

      // Check if specific specialty is covered
      if (Array.isArray(entitlements.specialists.types) && 
          !entitlements.specialists.types.includes(details.specialty)) {
        return {
          entitled: false,
          reason: `This specialty (${details.specialty}) is not covered. Upgrade to Advanced for full specialist access.`,
        };
      }
    }

    // Check ailment category for Basic package
    if (details.ailment && entitlements.consultations.ailments !== 'all') {
      if (!entitlements.consultations.ailments.includes(details.ailment)) {
        return {
          entitled: false,
          reason: 'This ailment is not covered by your Basic package. Upgrade to Medium or Advanced.',
        };
      }
    }

    return {
      entitled: true,
      reason: 'Service is covered by your package',
    };
  }

  /**
   * Check drug dispensing entitlement
   */
  checkDrugEntitlement(entitlements, details) {
    if (!entitlements.drugDispensing.allowed) {
      return {
        entitled: false,
        reason: 'Drug dispensing not allowed for this package',
      };
    }

    // Check drug category
    if (details.drugCategory) {
      if (entitlements.drugDispensing.categories === 'all') {
        return { entitled: true };
      }

      if (!entitlements.drugDispensing.categories.includes(details.drugCategory)) {
        return {
          entitled: false,
          reason: `This drug category (${details.drugCategory}) is not covered. Upgrade your package.`,
        };
      }
    }

    // Check monthly limit
    if (entitlements.drugDispensing.limitPerMonth && details.monthlyCount) {
      if (details.monthlyCount >= entitlements.drugDispensing.limitPerMonth) {
        return {
          entitled: false,
          reason: `Monthly drug limit (${entitlements.drugDispensing.limitPerMonth}) reached. Limit resets next month.`,
        };
      }
    }

    return {
      entitled: true,
      reason: 'Drug is covered by your package',
    };
  }

  /**
   * Check minor surgery entitlement
   */
  checkMinorSurgeryEntitlement(entitlements, details) {
    if (!entitlements.surgeries.allowed) {
      return {
        entitled: false,
        reason: 'Surgeries not allowed for Basic package. Upgrade to Medium or Advanced.',
      };
    }

    // Check if minor surgeries are included
    if (Array.isArray(entitlements.surgeries.types)) {
      const hasMinorSurgeries = entitlements.surgeries.types.some(type => 
        ['appendectomy', 'wound_suturing', 'minor_orthopedic', 'cyst_removal'].includes(type)
      );

      if (!hasMinorSurgeries) {
        return {
          entitled: false,
          reason: 'Minor surgeries not covered. Please check your package.',
        };
      }
    }

    // Check yearly limit
    if (entitlements.surgeries.limitPerYear && details.yearlyCount) {
      if (details.yearlyCount >= entitlements.surgeries.limitPerYear) {
        return {
          entitled: false,
          reason: `Annual surgery limit (${entitlements.surgeries.limitPerYear}) reached. Limit resets next year.`,
        };
      }
    }

    return {
      entitled: true,
      reason: 'Minor surgery is covered by your package',
    };
  }

  /**
   * Check major surgery entitlement
   */
  checkMajorSurgeryEntitlement(entitlements, details) {
    if (!entitlements.surgeries.allowed) {
      return {
        entitled: false,
        reason: 'Surgeries not allowed for Basic package. Upgrade to Medium or Advanced.',
      };
    }

    // Major surgeries only for Advanced
    if (entitlements.surgeries.types === 'all' || 
        (Array.isArray(entitlements.surgeries.types) && 
         entitlements.surgeries.types.some(type => 
           ['cardiac_surgery', 'major_orthopedic', 'neurosurgery'].includes(type)))) {
      return {
        entitled: true,
        reason: 'Major surgery is covered by your Advanced package',
      };
    }

    return {
      entitled: false,
      reason: 'Major surgeries not covered. Upgrade to Advanced package.',
    };
  }

  /**
   * Check laboratory test entitlement
   */
  checkLabTestEntitlement(entitlements, details) {
    if (!entitlements.laboratoryTests.allowed) {
      return {
        entitled: false,
        reason: 'Laboratory tests not allowed for this package',
      };
    }

    // Check test type
    if (details.testType) {
      if (entitlements.laboratoryTests.types === 'all') {
        return { entitled: true };
      }

      if (!entitlements.laboratoryTests.types.includes(details.testType)) {
        return {
          entitled: false,
          reason: `This test (${details.testType}) is not covered. Upgrade your package.`,
        };
      }
    }

    // Check monthly limit
    if (entitlements.laboratoryTests.limitPerMonth && details.monthlyCount) {
      if (details.monthlyCount >= entitlements.laboratoryTests.limitPerMonth) {
        return {
          entitled: false,
          reason: `Monthly lab test limit (${entitlements.laboratoryTests.limitPerMonth}) reached.`,
        };
      }
    }

    return {
      entitled: true,
      reason: 'Laboratory test is covered by your package',
    };
  }

  /**
   * Check imaging entitlement
   */
  checkImagingEntitlement(entitlements, details) {
    if (!entitlements.imaging.allowed) {
      return {
        entitled: false,
        reason: 'Imaging tests not allowed for Basic package. Upgrade to Medium or Advanced.',
      };
    }

    // Check imaging type
    if (details.imagingType) {
      if (entitlements.imaging.types === 'all') {
        return { entitled: true };
      }

      if (!entitlements.imaging.types.includes(details.imagingType)) {
        return {
          entitled: false,
          reason: `This imaging type (${details.imagingType}) is not covered. Upgrade to Advanced for full imaging access.`,
        };
      }
    }

    // Check monthly limit
    if (entitlements.imaging.limitPerMonth && details.monthlyCount) {
      if (details.monthlyCount >= entitlements.imaging.limitPerMonth) {
        return {
          entitled: false,
          reason: `Monthly imaging limit (${entitlements.imaging.limitPerMonth}) reached.`,
        };
      }
    }

    return {
      entitled: true,
      reason: 'Imaging test is covered by your package',
    };
  }

  /**
   * Check admission entitlement
   */
  checkAdmissionEntitlement(entitlements, details) {
    if (!entitlements.admissions.allowed) {
      return {
        entitled: false,
        reason: 'Hospital admissions not allowed for Basic package. Upgrade to Medium or Advanced.',
      };
    }

    // Check admission days limit
    if (entitlements.admissions.maxDays && details.requestedDays) {
      if (details.requestedDays > entitlements.admissions.maxDays) {
        return {
          entitled: false,
          reason: `Admission exceeds package limit of ${entitlements.admissions.maxDays} days. Upgrade to Advanced for unlimited days.`,
        };
      }
    }

    return {
      entitled: true,
      reason: 'Hospital admission is covered by your package',
    };
  }

  /**
   * Check emergency entitlement
   */
  checkEmergencyEntitlement(entitlements, details) {
    if (!entitlements.emergency.allowed) {
      return {
        entitled: false,
        reason: 'Emergency services not configured',
      };
    }

    return {
      entitled: true,
      reason: `Emergency service covered: ${entitlements.emergency.coverage}`,
      coverage: entitlements.emergency.coverage,
    };
  }

  /**
   * Get package limitations
   */
  getPackageLimitations(packageType) {
    const entitlements = PACKAGE_ENTITLEMENTS[packageType];
    if (!entitlements) {
      return [];
    }
    return entitlements.limitations || [];
  }

  /**
   * Get full package details
   */
  getPackageDetails(packageType) {
    return PACKAGE_ENTITLEMENTS[packageType] || null;
  }

  /**
   * Compare packages (for upgrade recommendations)
   */
  comparePackages(currentPackage, desiredService) {
    const packages = [PACKAGE_TYPES.BASIC, PACKAGE_TYPES.MEDIUM, PACKAGE_TYPES.ADVANCED];
    const recommendations = [];

    for (const pkg of packages) {
      if (pkg === currentPackage) continue;

      const check = this.isServiceEntitled(pkg, desiredService.type, desiredService.details);
      if (check.entitled) {
        recommendations.push({
          package: pkg,
          price: PACKAGE_ENTITLEMENTS[pkg].price,
          currency: PACKAGE_ENTITLEMENTS[pkg].currency,
        });
      }
    }

    return recommendations;
  }
}

// Export singleton instance
const entitlementChecker = new EntitlementChecker();
export default entitlementChecker;
export { EntitlementChecker };
