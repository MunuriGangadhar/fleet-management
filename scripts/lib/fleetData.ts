export interface DriverSeed {
  name: string
  phone: string
  license_number: string
  status: 'active' | 'on_leave' | 'inactive'
  rating: number
}

export const DRIVERS_SEED: DriverSeed[] = [
  { name: 'Ravi Kumar', phone: '+91 98450 11223', license_number: 'KA0120180012345', status: 'active', rating: 4.7 },
  { name: 'Suresh Babu', phone: '+91 98860 22334', license_number: 'KA0320190023456', status: 'active', rating: 4.5 },
  { name: 'Manjunath Gowda', phone: '+91 99000 33445', license_number: 'KA0520170034567', status: 'active', rating: 4.2 },
  { name: 'Anitha Reddy', phone: '+91 97400 44556', license_number: 'KA0220200045678', status: 'active', rating: 4.8 },
  { name: 'Prakash Rao', phone: '+91 98440 55667', license_number: 'KA0420180056789', status: 'active', rating: 4.1 },
  { name: 'Deepak Shetty', phone: '+91 99860 66778', license_number: 'KA0120210067890', status: 'active', rating: 4.6 },
  { name: 'Lakshmi Narayan', phone: '+91 97420 77889', license_number: 'KA0320190078901', status: 'on_leave', rating: 4.3 },
  { name: 'Venkatesh Iyer', phone: '+91 98450 88990', license_number: 'KA0520220089012', status: 'active', rating: 4.0 },
  { name: 'Kavya Sharma', phone: '+91 99000 99001', license_number: 'KA0220210090123', status: 'active', rating: 4.9 },
  { name: 'Naveen Patil', phone: '+91 98860 00112', license_number: 'KA0420200001234', status: 'inactive', rating: 3.8 },
  { name: 'Ramesh Chandra', phone: '+91 97400 11334', license_number: 'KA0120170012346', status: 'active', rating: 4.4 },
]

export interface VehicleSeed {
  registration_number: string
  name: string
  make: string
  model: string
  vehicle_type: 'truck' | 'van' | 'car' | 'bike'
  isEV: boolean
  homeBase: string
}

export const VEHICLES_SEED: VehicleSeed[] = [
  { registration_number: 'KA-01-AB-1001', name: 'Whitefield Hauler 1', make: 'Tata', model: 'Ultra T.7', vehicle_type: 'truck', isEV: false, homeBase: 'Whitefield Depot' },
  { registration_number: 'KA-01-AB-1002', name: 'Whitefield Hauler 2', make: 'Ashok Leyland', model: 'Dost+', vehicle_type: 'truck', isEV: false, homeBase: 'Whitefield Depot' },
  { registration_number: 'KA-03-CD-2001', name: 'City Freight 1', make: 'Eicher', model: 'Pro 2049', vehicle_type: 'truck', isEV: false, homeBase: 'Marathahalli' },
  { registration_number: 'KA-03-CD-2002', name: 'City Freight 2', make: 'Tata', model: '407 Gold', vehicle_type: 'truck', isEV: false, homeBase: 'KR Puram' },
  { registration_number: 'KA-05-EF-3001', name: 'Swift Courier 1', make: 'Mahindra', model: 'Supro Maxx', vehicle_type: 'van', isEV: false, homeBase: 'HSR Layout' },
  { registration_number: 'KA-05-EF-3002', name: 'Swift Courier 2', make: 'Tata', model: 'Ace Gold', vehicle_type: 'van', isEV: false, homeBase: 'Electronic City' },
  { registration_number: 'KA-02-GH-3003', name: 'Swift Courier 3', make: 'Force', model: 'Traveller', vehicle_type: 'van', isEV: false, homeBase: 'Jayanagar' },
  { registration_number: 'KA-02-GH-3004', name: 'EV Courier 1', make: 'Tata', model: 'Ace EV', vehicle_type: 'van', isEV: true, homeBase: 'Koramangala' },
  { registration_number: 'KA-04-IJ-4001', name: 'Ops Sedan 1', make: 'Maruti Suzuki', model: 'Dzire', vehicle_type: 'car', isEV: false, homeBase: 'MG Road' },
  { registration_number: 'KA-04-IJ-4002', name: 'Ops Sedan 2', make: 'Hyundai', model: 'Aura', vehicle_type: 'car', isEV: false, homeBase: 'Indiranagar' },
  { registration_number: 'KA-04-IJ-4003', name: 'Ops EV Sedan', make: 'Tata', model: 'Tigor EV', vehicle_type: 'car', isEV: true, homeBase: 'Hebbal' },
  { registration_number: 'KA-51-KL-5001', name: 'Last-mile Rider 1', make: 'Bajaj', model: 'CT 110X', vehicle_type: 'bike', isEV: false, homeBase: 'Jayanagar' },
  { registration_number: 'KA-51-KL-5002', name: 'Last-mile EV Rider 1', make: 'Ather', model: '450X', vehicle_type: 'bike', isEV: true, homeBase: 'Koramangala' },
  { registration_number: 'KA-51-KL-5003', name: 'Last-mile EV Rider 2', make: 'Ola Electric', model: 'S1 Pro', vehicle_type: 'bike', isEV: true, homeBase: 'Yeshwanthpur' },
]
