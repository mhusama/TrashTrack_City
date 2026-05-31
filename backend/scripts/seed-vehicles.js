/**
 * Seeds the `vehicle` collection in the main MongoDB database (MONGODB_DB_NAME, default `test`).
 *
 * Run from backend: npm run seed:vehicles
 */
import "dotenv/config";
import { connectDB } from "../src/config/db.js";
import { Vehicle } from "../src/models/Vehicle.js";

const VEHICLES = [
  {
    no: 1,
    vehicleName: "FMX 420 Garbage Compactor",
    vehicleType: "Rear Loader Garbage Truck",
    manufacturer: "Volvo Trucks",
    registrationNumber: "DHAKA METRO-TA 11-4587",
  },
  {
    no: 2,
    vehicleName: "Econic 2630L",
    vehicleType: "Refuse Collection Vehicle",
    manufacturer: "Mercedes-Benz",
    registrationNumber: "DHAKA METRO-DA 24-7812",
  },
  {
    no: 3,
    vehicleName: "FE 180 Mini Waste Carrier",
    vehicleType: "Small Garbage Pickup Truck",
    manufacturer: "Mitsubishi Fuso",
    registrationNumber: "CHATTOGRAM METRO-HA 17-2294",
  },
  {
    no: 4,
    vehicleName: "Isuzu NQR 71",
    vehicleType: "Dumpster Cleaning Truck",
    manufacturer: "Isuzu Motors",
    registrationNumber: "DHAKA METRO-TH 13-9451",
  },
  {
    no: 5,
    vehicleName: "Actros 3336K",
    vehicleType: "Industrial Waste Transport Truck",
    manufacturer: "Mercedes-Benz",
    registrationNumber: "RAJSHAHI METRO-BA 19-6720",
  },
  {
    no: 6,
    vehicleName: "Tata Ultra 1918",
    vehicleType: "Municipal Garbage Carrier",
    manufacturer: "Tata Motors",
    registrationNumber: "KHULNA METRO-TA 15-3318",
  },
  {
    no: 7,
    vehicleName: "Hino 500 FG8J",
    vehicleType: "Waste Compactor Truck",
    manufacturer: "Hino Motors",
    registrationNumber: "DHAKA METRO-SA 21-8745",
  },
  {
    no: 8,
    vehicleName: "Mack LR Electric",
    vehicleType: "Smart Electric Garbage Truck",
    manufacturer: "Mack Trucks",
    registrationNumber: "DHAKA METRO-GA 31-5502",
  },
  {
    no: 9,
    vehicleName: "Dennis Eagle Elite+",
    vehicleType: "Automated Side Loader",
    manufacturer: "Dennis Eagle",
    registrationNumber: "SYLHET METRO-CHA 18-6639",
  },
  {
    no: 10,
    vehicleName: "Foton Aumark S",
    vehicleType: "Bio-Waste Collection Van",
    manufacturer: "Foton Motor",
    registrationNumber: "DHAKA METRO-KA 12-7480",
  },
  {
    no: 11,
    vehicleName: "BYD T8 Electric Refuse Truck",
    vehicleType: "Electric Waste Disposal Truck",
    manufacturer: "BYD Auto",
    registrationNumber: "DHAKA METRO-NA 26-4107",
  },
  {
    no: 12,
    vehicleName: "Ashok Leyland Boss 1415",
    vehicleType: "Medical Waste Carrier",
    manufacturer: "Ashok Leyland",
    registrationNumber: "BARISHAL METRO-THA 16-2045",
  },
  {
    no: 13,
    vehicleName: "Scania P360 XT",
    vehicleType: "Heavy Duty Landfill Transporter",
    manufacturer: "Scania",
    registrationNumber: "DHAKA METRO-RA 28-9391",
  },
  {
    no: 14,
    vehicleName: "Hyundai Mighty EX8",
    vehicleType: "Urban Cleaning Vehicle",
    manufacturer: "Hyundai Motor Company",
    registrationNumber: "RANGPUR METRO-DA 14-5826",
  },
  {
    no: 15,
    vehicleName: "Iveco Eurocargo ML180",
    vehicleType: "Recycling Collection Truck",
    manufacturer: "Iveco",
    registrationNumber: "DHAKA METRO-LA 22-3159",
  },
  {
    no: 16,
    vehicleName: "Kenworth T370",
    vehicleType: "Roll-Off Dumpster Truck",
    manufacturer: "Kenworth",
    registrationNumber: "MYMENSINGH METRO-TA 20-7644",
  },
  {
    no: 17,
    vehicleName: "Dongfeng KC 6x4",
    vehicleType: "Construction Debris Hauler",
    manufacturer: "Dongfeng Motor Corporation",
    registrationNumber: "DHAKA METRO-BA 27-1198",
  },
  {
    no: 18,
    vehicleName: "Toyota Hilux Utility Waste Unit",
    vehicleType: "Small Waste Inspection Pickup",
    manufacturer: "Toyota",
    registrationNumber: "DHAKA METRO-JHA 10-6672",
  },
  {
    no: 19,
    vehicleName: "MAN TGS 28.400",
    vehicleType: "Hazardous Waste Disposal Truck",
    manufacturer: "MAN Truck & Bus",
    registrationNumber: "CUMILLA METRO-SA 23-8821",
  },
  {
    no: 20,
    vehicleName: "Peterbilt 520EV",
    vehicleType: "Electric Side Loader Garbage Truck",
    manufacturer: "Peterbilt",
    registrationNumber: "DHAKA METRO-MA 29-4735",
  },
];

async function main() {
  await connectDB();
  await Vehicle.deleteMany({});
  const inserted = await Vehicle.insertMany(VEHICLES);
  console.log(`Inserted ${inserted.length} vehicles into collection "vehicle".`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
