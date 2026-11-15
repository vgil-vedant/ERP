'use strict';

/**
 * Reference data the demonstration dataset is built from: Maharashtra districts,
 * their police stations, court complexes, prisons and forensic laboratories,
 * and the offences the dataset uses with their sections of law.
 *
 * Institution names are the public names of real institutions. Every person,
 * case and number built from them is synthetic.
 */

const DISTRICTS = {
  pune: {
    name: 'Pune', state: 'Maharashtra', cnr: 'PU',
    localities: [
      { loc: 'Shivajinagar', pc: '411005', po: 'Shivajinagar H.O', subdist: 'Pune City', ps: 'Shivajinagar' },
      { loc: 'Kothrud', pc: '411038', po: 'Kothrud S.O', subdist: 'Pune City', ps: 'Kothrud' },
      { loc: 'Hadapsar', pc: '411028', po: 'Hadapsar S.O', subdist: 'Haveli', ps: 'Hadapsar' },
      { loc: 'Yerawada', pc: '411006', po: 'Yerawada S.O', subdist: 'Pune City', ps: 'Yerawada' },
      { loc: 'Wakad', pc: '411057', po: 'Wakad S.O', subdist: 'Haveli', ps: 'Wakad' },
      { loc: 'Swargate', pc: '411042', po: 'Swargate S.O', subdist: 'Pune City', ps: 'Swargate' },
    ],
    court: 'District and Sessions Court, Pune', complex: 'Shivajinagar Court Complex', magistrate: 'Judicial Magistrate First Class',
    prison: { code: 'YRW', name: 'Yerawada Central Prison, Pune' },
    womenPrison: { code: 'YWP', name: 'Yerawada Women Central Prison, Pune' },
    lab: { code: 'PUN', prefix: 'RFSL', name: 'Regional Forensic Science Laboratory, Pune' },
    hospital: 'Sassoon General Hospital, Pune',
    asks: 'Aadhaar Seva Kendra, Pune',
  },
  mumbai: {
    name: 'Mumbai', state: 'Maharashtra', cnr: 'CC',
    localities: [
      { loc: 'Dadar West', pc: '400028', po: 'Dadar S.O', subdist: 'Mumbai City', dist: 'Mumbai', ps: 'Dadar' },
      { loc: 'Andheri East', pc: '400069', po: 'Andheri East S.O', subdist: 'Andheri', dist: 'Mumbai Suburban', ps: 'Andheri' },
      { loc: 'Kurla West', pc: '400070', po: 'Kurla S.O', subdist: 'Kurla', dist: 'Mumbai Suburban', ps: 'Kurla' },
      { loc: 'Colaba', pc: '400005', po: 'Colaba S.O', subdist: 'Mumbai City', dist: 'Mumbai', ps: 'Colaba' },
      { loc: 'Malad West', pc: '400064', po: 'Malad West S.O', subdist: 'Borivali', dist: 'Mumbai Suburban', ps: 'Malad' },
      { loc: 'Byculla', pc: '400027', po: 'Byculla S.O', subdist: 'Mumbai City', dist: 'Mumbai', ps: 'Byculla' },
    ],
    court: 'City Civil and Sessions Court, Greater Mumbai', complex: 'Fort Court Complex', magistrate: 'Metropolitan Magistrate',
    prison: { code: 'MCP', name: 'Mumbai Central Prison (Arthur Road)' },
    womenPrison: { code: 'BYC', name: 'Byculla District Prison, Mumbai' },
    lab: { code: 'MUM', prefix: 'DFSL', name: 'Directorate of Forensic Science Laboratories, Kalina, Mumbai' },
    hospital: 'Sir J. J. Group of Hospitals, Mumbai',
    asks: 'Aadhaar Seva Kendra, Mumbai',
  },
  thane: {
    name: 'Thane', state: 'Maharashtra', cnr: 'TH',
    localities: [
      { loc: 'Naupada', pc: '400602', po: 'Naupada S.O', subdist: 'Thane', ps: 'Naupada' },
      { loc: 'Kalwa', pc: '400605', po: 'Kalwa S.O', subdist: 'Thane', ps: 'Kalwa' },
      { loc: 'Wagle Estate', pc: '400604', po: 'Wagle Estate S.O', subdist: 'Thane', ps: 'Wagle Estate' },
      { loc: 'Kopri', pc: '400603', po: 'Kopri Colony S.O', subdist: 'Thane', ps: 'Kopri' },
    ],
    court: 'District and Sessions Court, Thane', complex: 'Thane Court Complex', magistrate: 'Judicial Magistrate First Class',
    prison: { code: 'TCP', name: 'Thane Central Prison' },
    womenPrison: { code: 'BYC', name: 'Byculla District Prison, Mumbai' },
    lab: { code: 'MUM', prefix: 'DFSL', name: 'Directorate of Forensic Science Laboratories, Kalina, Mumbai' },
    hospital: 'Chhatrapati Shivaji Maharaj Hospital, Kalwa',
    asks: 'Aadhaar Seva Kendra, Thane',
  },
  nagpur: {
    name: 'Nagpur', state: 'Maharashtra', cnr: 'NG',
    localities: [
      { loc: 'Sitabuldi', pc: '440012', po: 'Sitabuldi S.O', subdist: 'Nagpur Urban', ps: 'Sitabuldi' },
      { loc: 'Sadar', pc: '440001', po: 'Nagpur G.P.O', subdist: 'Nagpur Urban', ps: 'Sadar' },
      { loc: 'Ajni', pc: '440003', po: 'Ajni S.O', subdist: 'Nagpur Urban', ps: 'Ajni' },
      { loc: 'Itwari', pc: '440002', po: 'Itwari S.O', subdist: 'Nagpur Urban', ps: 'Kotwali' },
    ],
    court: 'District and Sessions Court, Nagpur', complex: 'Nagpur Court Complex', magistrate: 'Judicial Magistrate First Class',
    prison: { code: 'NCP', name: 'Nagpur Central Prison' },
    womenPrison: { code: 'NCP', name: 'Nagpur Central Prison (women\'s section)' },
    lab: { code: 'NGP', prefix: 'RFSL', name: 'Regional Forensic Science Laboratory, Nagpur' },
    hospital: 'Government Medical College and Hospital, Nagpur',
    asks: 'Aadhaar Seva Kendra, Nagpur',
  },
  nashik: {
    name: 'Nashik', state: 'Maharashtra', cnr: 'NS',
    localities: [
      { loc: 'Panchavati', pc: '422003', po: 'Panchavati S.O', subdist: 'Nashik', ps: 'Panchavati' },
      { loc: 'Nashik Road', pc: '422101', po: 'Nashik Road S.O', subdist: 'Nashik', ps: 'Nashik Road' },
      { loc: 'Gangapur Road', pc: '422013', po: 'Gangapur Road S.O', subdist: 'Nashik', ps: 'Gangapur' },
      { loc: 'CIDCO', pc: '422009', po: 'CIDCO S.O', subdist: 'Nashik', ps: 'Ambad' },
    ],
    court: 'District and Sessions Court, Nashik', complex: 'Nashik Court Complex', magistrate: 'Judicial Magistrate First Class',
    prison: { code: 'NRC', name: 'Nashik Road Central Prison' },
    womenPrison: { code: 'NRC', name: 'Nashik Road Central Prison (women\'s section)' },
    lab: { code: 'NSK', prefix: 'RFSL', name: 'Regional Forensic Science Laboratory, Nashik' },
    hospital: 'Civil Hospital, Nashik',
    asks: 'Aadhaar Seva Kendra, Nashik',
  },
  sambhajinagar: {
    name: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', cnr: 'AU',
    localities: [
      { loc: 'Kranti Chowk', pc: '431001', po: 'Aurangabad H.O', subdist: 'Chhatrapati Sambhajinagar', ps: 'Kranti Chowk' },
      { loc: 'CIDCO N-5', pc: '431003', po: 'CIDCO S.O', subdist: 'Chhatrapati Sambhajinagar', ps: 'CIDCO' },
      { loc: 'Begumpura', pc: '431004', po: 'Begumpura S.O', subdist: 'Chhatrapati Sambhajinagar', ps: 'Begumpura' },
      { loc: 'Garkheda', pc: '431009', po: 'Garkheda S.O', subdist: 'Chhatrapati Sambhajinagar', ps: 'Jawahar Nagar' },
    ],
    court: 'District and Sessions Court, Chhatrapati Sambhajinagar', complex: 'Chhatrapati Sambhajinagar Court Complex', magistrate: 'Judicial Magistrate First Class',
    prison: { code: 'HCP', name: 'Harsul Central Prison, Chhatrapati Sambhajinagar' },
    womenPrison: { code: 'HCP', name: 'Harsul Central Prison (women\'s section)' },
    lab: { code: 'CSN', prefix: 'RFSL', name: 'Regional Forensic Science Laboratory, Chhatrapati Sambhajinagar' },
    hospital: 'Government Medical College and Hospital, Chhatrapati Sambhajinagar',
    asks: 'Aadhaar Seva Kendra, Chhatrapati Sambhajinagar',
  },
  kolhapur: {
    name: 'Kolhapur', state: 'Maharashtra', cnr: 'KO',
    localities: [
      { loc: 'Rajarampuri', pc: '416008', po: 'Rajarampuri S.O', subdist: 'Karveer', ps: 'Rajarampuri' },
      { loc: 'Shahupuri', pc: '416001', po: 'Kolhapur H.O', subdist: 'Karveer', ps: 'Shahupuri' },
      { loc: 'Laxmipuri', pc: '416002', po: 'Laxmipuri S.O', subdist: 'Karveer', ps: 'Laxmipuri' },
      { loc: 'Kasaba Bawada', pc: '416006', po: 'Kasaba Bawada S.O', subdist: 'Karveer', ps: 'Karveer' },
    ],
    court: 'District and Sessions Court, Kolhapur', complex: 'Kolhapur Court Complex', magistrate: 'Judicial Magistrate First Class',
    prison: { code: 'KCP', name: 'Kalamba Central Prison, Kolhapur' },
    womenPrison: { code: 'KCP', name: 'Kalamba Central Prison (women\'s section)' },
    lab: { code: 'KOP', prefix: 'RFSL', name: 'Regional Forensic Science Laboratory, Kolhapur' },
    hospital: 'Chhatrapati Pramilaraje Hospital, Kolhapur',
    asks: 'Aadhaar Seva Kendra, Kolhapur',
  },
  amravati: {
    name: 'Amravati', state: 'Maharashtra', cnr: 'AM',
    localities: [
      { loc: 'Rajapeth', pc: '444606', po: 'Rajapeth S.O', subdist: 'Amravati', ps: 'Rajapeth' },
      { loc: 'Camp', pc: '444602', po: 'Amravati Camp S.O', subdist: 'Amravati', ps: 'Kotwali' },
      { loc: 'Badnera', pc: '444701', po: 'Badnera S.O', subdist: 'Amravati', ps: 'Badnera' },
      { loc: 'Gadge Nagar', pc: '444603', po: 'Gadge Nagar S.O', subdist: 'Amravati', ps: 'Gadge Nagar' },
    ],
    court: 'District and Sessions Court, Amravati', complex: 'Amravati Court Complex', magistrate: 'Judicial Magistrate First Class',
    prison: { code: 'ACP', name: 'Amravati Central Prison' },
    womenPrison: { code: 'ACP', name: 'Amravati Central Prison (women\'s section)' },
    lab: { code: 'AMT', prefix: 'RFSL', name: 'Regional Forensic Science Laboratory, Amravati' },
    hospital: 'District General Hospital, Amravati',
    asks: 'Aadhaar Seva Kendra, Amravati',
  },
  solapur: {
    name: 'Solapur', state: 'Maharashtra', cnr: 'SO',
    localities: [
      { loc: 'Jodbhavi Peth', pc: '413002', po: 'Solapur H.O', subdist: 'Solapur North', ps: 'Jodbhavi Peth' },
      { loc: 'Sadar Bazar', pc: '413003', po: 'Sadar Bazar S.O', subdist: 'Solapur North', ps: 'Sadar Bazar' },
      { loc: 'MIDC Akkalkot Road', pc: '413006', po: 'MIDC S.O', subdist: 'Solapur South', ps: 'MIDC' },
      { loc: 'Vijapur Road', pc: '413004', po: 'Vijapur Road S.O', subdist: 'Solapur South', ps: 'Vijapur Naka' },
    ],
    court: 'District and Sessions Court, Solapur', complex: 'Solapur Court Complex', magistrate: 'Judicial Magistrate First Class',
    prison: { code: 'SDP', name: 'Solapur District Prison' },
    womenPrison: { code: 'YWP', name: 'Yerawada Women Central Prison, Pune' },
    lab: { code: 'PUN', prefix: 'RFSL', name: 'Regional Forensic Science Laboratory, Pune' },
    hospital: 'Dr. Vaishampayan Memorial Government Medical College, Solapur',
    asks: 'Aadhaar Seva Kendra, Solapur',
  },
};

/**
 * Offences. `bns` applies to an FIR registered on or after 1 July 2024 (the
 * Bharatiya Nyaya Sanhita), `ipc` to one registered before it.
 */
const CRIMES = {
  murder: {
    title: 'Murder', courtType: 'Sessions Case', courtAbbr: 'S.C.', sessions: true,
    bns: [['BNS', '103(1)'], ['BNS', '3(5)']], ipc: [['IPC', '302'], ['IPC', '34']],
    division: { code: 'DNA', name: 'Biology and DNA' }, death: true,
    exhibits: [
      { description: 'Blood-stained clothes of the deceased (shirt and trousers), packed in a cloth parcel', qty: [2, 'items'], source: 'Seized from the body at the inquest panchanama' },
      { description: 'Blood sample of the deceased drawn at post-mortem', qty: [5, 'ml'], preservative: 'sodium_fluoride', source: 'Handed over by the autopsy surgeon' },
      { description: 'Kitchen knife with a blood-stained blade (weapon of offence)', qty: [1, 'item'], source: 'Recovered at the instance of the accused under a recovery panchanama' },
    ],
    questions: ['Whether the blood on exhibits 1 and 3 is human blood, and of which group', 'Whether the DNA profile on exhibit 3 matches the deceased'],
    sentence: 'Imprisonment for life and a fine of Rs. 25,000', years: null,
  },
  attempt: {
    title: 'Attempt to murder', courtType: 'Sessions Case', courtAbbr: 'S.C.', sessions: true,
    bns: [['BNS', '109'], ['BNS', '118(1)']], ipc: [['IPC', '307'], ['IPC', '324']],
    division: { code: 'BIO', name: 'Biology and Serology' }, injury: true,
    exhibits: [
      { description: 'Blood-stained clothes of the injured, packed in a cloth parcel', qty: [2, 'items'], source: 'Handed over by the medical officer' },
      { description: 'Iron rod (weapon of offence)', qty: [1, 'item'], source: 'Recovered from the spot of incident under the spot panchanama' },
    ],
    questions: ['Whether the blood on exhibits 1 and 2 is human blood, and of which group'],
    sentence: 'Rigorous imprisonment for 7 years and a fine of Rs. 10,000', years: 7,
  },
  robbery: {
    title: 'Robbery with a firearm', courtType: 'Sessions Case', courtAbbr: 'S.C.', sessions: true,
    bns: [['BNS', '309(4)'], ['BNS', '3(5)'], ['Arms Act', '25']], ipc: [['IPC', '392'], ['IPC', '34'], ['Arms Act', '25']],
    division: { code: 'BAL', name: 'Ballistics' },
    exhibits: [
      { description: 'Country-made pistol with a magazine', qty: [1, 'item'], source: 'Seized from the accused at the time of arrest' },
      { description: 'Two live cartridges of 7.65 mm', qty: [2, 'items'], source: 'Seized from the magazine of exhibit 1' },
    ],
    questions: ['Whether exhibit 1 is a firearm in working order', 'Whether exhibit 2 are live cartridges that can be fired from exhibit 1'],
    sentence: 'Rigorous imprisonment for 5 years and a fine of Rs. 5,000', years: 5,
  },
  ndps: {
    title: 'Possession of a narcotic drug (commercial quantity)', courtType: 'Special Case (NDPS)', courtAbbr: 'NDPS Spl. Case', sessions: true,
    bns: [['NDPS Act', '8(c)'], ['NDPS Act', '22(c)']], ipc: [['NDPS Act', '8(c)'], ['NDPS Act', '22(c)']],
    division: { code: 'NAR', name: 'Narcotics (Chemistry)' },
    exhibits: [
      { description: 'Sample A: white crystalline powder suspected to be mephedrone, in a sealed polythene packet', qty: [10, 'g'], source: 'Drawn from the seized quantity in the presence of panchas' },
      { description: 'Sample B: duplicate of sample A', qty: [10, 'g'], source: 'Drawn from the seized quantity in the presence of panchas' },
    ],
    questions: ['Whether samples A and B contain a narcotic drug or psychotropic substance, and which'],
    sentence: 'Rigorous imprisonment for 10 years and a fine of Rs. 1,00,000', years: 10,
  },
  cyber: {
    title: 'Online cheating by impersonation', courtType: 'Regular Criminal Case', courtAbbr: 'R.C.C.',
    bns: [['BNS', '318(4)'], ['IT Act', '66C'], ['IT Act', '66D']], ipc: [['IPC', '420'], ['IT Act', '66C'], ['IT Act', '66D']],
    division: { code: 'CYB', name: 'Computer Forensics' }, computer: true,
    exhibits: [
      { description: 'Mobile handset with two SIM cards, seized from the accused', qty: [1, 'item'], source: 'Seized at the time of arrest under a seizure panchanama' },
      { description: 'Laptop computer with its charger', qty: [1, 'item'], source: 'Seized from the residence of the accused' },
      { description: 'Blank 1 TB storage device supplied for the image copy', qty: [1, 'item'], source: 'Supplied by the investigating officer' },
    ],
    questions: ['Whether exhibits 1 and 2 hold the messages, call records and transaction records listed in the forwarding letter'],
    sentence: 'Simple imprisonment for 2 years and a fine of Rs. 50,000', years: 2,
  },
  theft: {
    title: 'House-breaking and theft', courtType: 'Regular Criminal Case', courtAbbr: 'R.C.C.',
    bns: [['BNS', '331(4)'], ['BNS', '305']], ipc: [['IPC', '457'], ['IPC', '380']],
    division: null,
    sentence: 'Rigorous imprisonment for 4 years and a fine of Rs. 5,000', years: 4,
  },
  cheating: {
    title: 'Cheating with a forged cheque', courtType: 'Regular Criminal Case', courtAbbr: 'R.C.C.',
    bns: [['BNS', '318(4)'], ['BNS', '336(3)']], ipc: [['IPC', '420'], ['IPC', '468']],
    division: { code: 'QDE', name: 'Questioned Documents' },
    exhibits: [
      { description: 'Disputed cheque bearing the questioned signature', qty: [1, 'item'], source: 'Produced by the complainant\'s bank' },
      { description: 'Specimen signatures of the accused on twelve sheets', qty: [12, 'sheets'], source: 'Taken before the executive magistrate' },
    ],
    questions: ['Whether the questioned signature on exhibit 1 was written by the person who wrote the specimens in exhibit 2'],
    sentence: 'Rigorous imprisonment for 3 years and a fine of Rs. 20,000', years: 3,
  },
  poison: {
    title: 'Culpable homicide by poisoning', courtType: 'Sessions Case', courtAbbr: 'S.C.', sessions: true,
    bns: [['BNS', '105'], ['BNS', '123']], ipc: [['IPC', '304'], ['IPC', '328']],
    division: { code: 'TOX', name: 'Toxicology' }, death: true,
    exhibits: [
      { description: 'Viscera of the deceased (stomach with contents, liver, kidney) in a sealed glass jar', qty: [500, 'g'], preservative: 'saturated_common_salt', source: 'Preserved by the autopsy surgeon' },
      { description: 'Blood of the deceased in a sealed vial', qty: [10, 'ml'], preservative: 'sodium_fluoride', source: 'Preserved by the autopsy surgeon' },
      { description: 'Steel tumbler with residue, recovered from the house', qty: [1, 'item'], source: 'Seized under the spot panchanama' },
    ],
    questions: ['Whether exhibits 1 to 3 contain any poison, and which', 'Whether the poison in exhibit 3 is the poison found in exhibits 1 and 2'],
    sentence: 'Rigorous imprisonment for 10 years and a fine of Rs. 25,000', years: 10,
  },
  arms: {
    title: 'Possession of an illegal firearm', courtType: 'Regular Criminal Case', courtAbbr: 'R.C.C.',
    bns: [['Arms Act', '3'], ['Arms Act', '25']], ipc: [['Arms Act', '3'], ['Arms Act', '25']],
    division: { code: 'BAL', name: 'Ballistics' },
    exhibits: [
      { description: 'Country-made pistol (katta)', qty: [1, 'item'], source: 'Seized from the accused under a seizure panchanama' },
      { description: 'One live cartridge of 8 mm', qty: [1, 'item'], source: 'Seized from the pistol' },
    ],
    questions: ['Whether exhibit 1 is a firearm within the meaning of the Arms Act, 1959, and in working order'],
    sentence: 'Rigorous imprisonment for 3 years and a fine of Rs. 10,000', years: 3,
  },
  cruelty: {
    title: 'Cruelty by husband and relatives', courtType: 'Regular Criminal Case', courtAbbr: 'R.C.C.',
    bns: [['BNS', '85'], ['BNS', '115(2)'], ['BNS', '351(2)']], ipc: [['IPC', '498A'], ['IPC', '323'], ['IPC', '506']],
    division: null,
    sentence: 'Rigorous imprisonment for 2 years and a fine of Rs. 5,000', years: 2,
  },
};

const OFFICER_NAMES = [
  'Sandeep Mane', 'Vaishali Kadam', 'Rajendra Shelar', 'Sunil Bagal', 'Meena Dhumal', 'Prakash Koli',
  'Nilesh Bhujbal', 'Ravindra Gaikwad', 'Shubhangi Pawar', 'Mohan Lokhande', 'Ashok Jagtap', 'Deepak Raut',
  'Archana Sutar', 'Vinod Patole', 'Hemant Kharat', 'Smita Bhalerao',
];
const IO_RANKS = ['PSI', 'API', 'PI'];
const RANK_NAME = { PSI: 'Police Sub-Inspector', API: 'Assistant Police Inspector', PI: 'Police Inspector', ACP: 'Assistant Commissioner of Police', DCP: 'Deputy Commissioner of Police' };

const ADVOCATES = [
  ['S. R. Kulkarni', 'MH/1187/2004'], ['A. M. Shaikh', 'MH/2741/2009'], ['P. V. Deshpande', 'MH/0932/2001'],
  ['N. K. Bhosale', 'MH/3310/2012'], ['R. D. Fernandes', 'MH/1964/2006'], ['M. S. Joshi', 'MH/4128/2015'],
  ['K. B. Wagh', 'MH/2290/2008'], ['V. T. Salve', 'MH/3876/2013'],
];
const PROSECUTORS = ['S. G. Patankar', 'U. R. Mhaske', 'D. N. Lad', 'J. P. Ingle', 'A. A. Khan', 'R. S. Kamble'];

const PRESERVATIVE = {
  saturated_common_salt: 'Saturated common salt solution',
  rectified_spirit: 'Rectified spirit',
  sodium_fluoride: 'Sodium fluoride',
  sodium_hydroxide: '1% sodium hydroxide',
  liquid_paraffin: 'Liquid paraffin',
  formalin: '10% formalin',
};

/** Accepted documents used by the dataset, as named in Schedule II (May 2026). */
const DOCUMENTS = {
  passport: 'Valid Indian Passport',
  voter: 'Voter identity card (EPIC)',
  ration: 'Ration / PDS photograph card',
  driving: 'Driving licence',
  service: 'Service photo identity card',
  marksheet: 'Mark-sheet or certificate of a recognised Board of Education',
  electricity: 'Electricity bill (not older than 3 months)',
  rent: 'Registered rent or leave-and-licence agreement',
  birth: 'Birth certificate (Registration of Births and Deaths Act, 1969)',
  pid: 'Prisoner Induction Document (PID) issued by a Prison Officer',
};

module.exports = {
  DISTRICTS, CRIMES, OFFICER_NAMES, IO_RANKS, RANK_NAME, ADVOCATES, PROSECUTORS, PRESERVATIVE, DOCUMENTS,
};
