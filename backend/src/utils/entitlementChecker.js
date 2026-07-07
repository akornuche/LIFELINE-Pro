import { PACKAGE_ENTITLEMENTS, SERVICE_TYPES, PACKAGE_TYPES, PACKAGE_CATEGORIES } from '../constants/packages.js';
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
      const packageConfig = PACKAGE_ENTITLEMENTS[packageType];

      if (!packageConfig) {
        logger.error('Invalid package type', { packageType });
        return {
          entitled: false,
          reason: 'Invalid package type',
        };
      }

      // The per-service data lives under packageConfig.entitlements (nested object).
      const entitlements = packageConfig.entitlements;
      if (!entitlements) {
        logger.error('Package config missing entitlements sub-object', { packageType });
        return { entitled: false, reason: 'Invalid package configuration' };
      }

      switch (serviceType) {
        case SERVICE_TYPES.CONSULTATION:
          return this.checkConsultationEntitlement(entitlements, serviceDetails);

        case SERVICE_TYPES.PRESCRIPTION:
          return this.checkPrescriptionEntitlement(entitlements, serviceDetails);

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

        // ── Tier 1: available to all plans ──────────────────────────────
        case SERVICE_TYPES.VACCINATION:
          return { entitled: true, reason: 'Vaccination is covered by all plans' };

        // ── Tier 2: Basic Insurance & above ─────────────────────────────
        case SERVICE_TYPES.ANTENATAL_CARE:
          if (!entitlements.admissions?.allowed) {
            return { entitled: false, reason: 'Antenatal care requires Basic Insurance or above. Please upgrade your plan.' };
          }
          return { entitled: true, reason: 'Antenatal care is covered by your plan' };

        // ── Tier 3: Standard Insurance & above ──────────────────────────
        case SERVICE_TYPES.SPECIALIST_CONSULTATION:
          if (!entitlements.specialists?.allowed) {
            return { entitled: false, reason: 'Specialist consultations require Standard Insurance or above. Please upgrade.' };
          }
          return { entitled: true, reason: 'Specialist consultation is covered by your plan' };

        case SERVICE_TYPES.ADVANCED_LAB_TEST:
          if (!entitlements.laboratoryTests?.allowed ||
              (Array.isArray(entitlements.laboratoryTests.types) &&
               !entitlements.laboratoryTests.types.includes('lipid_profile'))) {
            return { entitled: false, reason: 'Advanced lab tests require Standard Insurance or above. Please upgrade.' };
          }
          return { entitled: true, reason: 'Advanced lab test is covered by your plan' };

        case SERVICE_TYPES.PHYSIOTHERAPY:
        case SERVICE_TYPES.MENTAL_HEALTH:
        case SERVICE_TYPES.DENTAL_CARE:
        case SERVICE_TYPES.CHRONIC_DISEASE_MANAGEMENT:
          if (!entitlements.specialists?.allowed) {
            return { entitled: false, reason: 'This service requires Standard Insurance or above. Please upgrade.' };
          }
          return { entitled: true, reason: 'Service is covered by your Standard plan' };

        // ── Tier 4: Premium Insurance only ──────────────────────────────
        case SERVICE_TYPES.ADVANCED_IMAGING:
          if (!entitlements.imaging?.allowed ||
              (Array.isArray(entitlements.imaging.types) &&
               !entitlements.imaging.types.includes('ct_scan'))) {
            return { entitled: false, reason: 'Advanced imaging (CT Scan, MRI, Mammography) requires Premium Insurance. Please upgrade.' };
          }
          return { entitled: true, reason: 'Advanced imaging is covered by your Premium plan' };

        case SERVICE_TYPES.MATERNITY_CARE:
        case SERVICE_TYPES.HOME_VISIT:
        case SERVICE_TYPES.AMBULANCE:
        case SERVICE_TYPES.SECOND_OPINION:
          if (!entitlements.priorityCare) {
            return { entitled: false, reason: 'This service is exclusive to Premium Insurance. Please upgrade your plan.' };
          }
          return { entitled: true, reason: 'Service is covered by your Premium plan' };

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
   * Check if patient's package allows access to a specific provider type
   * GENERAL plan = doctors only. Insurance plans = all providers.
   */
  checkProviderAccess(packageType, providerType) {
    const entitlements = PACKAGE_ENTITLEMENTS[packageType];
    if (!entitlements) {
      return {
        entitled: false,
        reason: 'Invalid package type',
      };
    }

    const allowedProviders = entitlements.allowedProviderTypes || [];
    if (!allowedProviders.includes(providerType)) {
      return {
        entitled: false,
        reason: `Your ${entitlements.name} does not include ${providerType} access. Upgrade to an Insurance plan.`,
      };
    }

    return {
      entitled: true,
      reason: `${providerType} access is covered by your ${entitlements.name}`,
    };
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
   * Check prescription entitlement (doctor-written script, not pharmacy dispensing)
   */
  checkPrescriptionEntitlement(entitlements, details) {
    if (!entitlements.prescriptions?.allowed) {
      return {
        entitled: false,
        reason: 'Prescriptions are not covered by your package. Please upgrade.',
      };
    }

    // Check drug category if provided
    if (details.drugCategory && entitlements.prescriptions.drugCategories) {
      if (!entitlements.prescriptions.drugCategories.includes(details.drugCategory)) {
        return {
          entitled: false,
          reason: `This drug category (${details.drugCategory}) is not covered by your prescription plan. Upgrade your package.`,
        };
      }
    }

    return {
      entitled: true,
      reason: 'Prescription is covered by your package',
    };
  }

  /**
   * Check drug dispensing entitlement (pharmacy fulfilment of a prescription)
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
    const packages = [PACKAGE_TYPES.GENERAL, PACKAGE_TYPES.BASIC, PACKAGE_TYPES.STANDARD, PACKAGE_TYPES.PREMIUM];
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
