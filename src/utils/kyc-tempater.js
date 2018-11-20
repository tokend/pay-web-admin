import { ID_DOCUMENT_TYPES } from '../constants'
import get from 'lodash/get'

export function fromKycTemplate (template) {
  return {
    firstName: template.first_name,
    lastName: template.last_name,
    dateOfBirth: template.date_of_birth,
    phoneNumber: template.phone_number,
    idExpirationDate: template.id_expiration_date,
    idSeries: template.id_series,
    citizenship: template.citizenship,
    idDocumentType: template.id_document_type || ID_DOCUMENT_TYPES.passport,
    documents: {
      kycIdDocument: get(template, 'documents.kyc_id_document.front.key') || get(template, 'documents.kyc_id_document.key'),
      kycIdDocumentBack: get(template, 'documents.kyc_id_document.back.key') || get(template, 'documents.kyc_id_document.key'),
      kycSelfie: template.documents.kyc_selfie
        ? get(template, 'documents.kyc_selfie.front.key') || get(template, 'documents.kyc_selfie.key')
        : get(template, 'documents.bravo.front.key') || get(template, 'documents.bravo.key'),
      kycPoa: get(template, 'documents.kyc_poa.front.key') || get(template, 'documents.kyc_poa.key')
    },
    address: {
      line1: template.address.line_1,
      line2: template.address.line_2,
      city: template.address.city,
      country: template.address.country,
      state: template.address.state,
      postalCode: template.address.postal_code
    },
    selfDescription: template.self_description
  }
}
