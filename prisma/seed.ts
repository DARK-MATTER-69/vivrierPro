import { PrismaClient, TypeVehicule } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seed...')
  await prisma.entrepot.upsert({ where: { id: 'entrepot-principal' }, update: {}, create: { id: 'entrepot-principal', nom: 'Entrepôt Central Vivrier', adresse: 'Zone Industrielle, Abidjan', latitude: 5.3600, longitude: -4.0083 } })
  const points = [
    { id: 'pd-001', nom: 'Marché Adjamé', adresse: 'Adjamé, Abidjan', latitude: 5.3677, longitude: -4.0314 },
    { id: 'pd-002', nom: 'Marché Cocody', adresse: 'Cocody, Abidjan', latitude: 5.3482, longitude: -3.9993 },
    { id: 'pd-003', nom: 'Marché Treichville', adresse: 'Treichville, Abidjan', latitude: 5.2986, longitude: -4.0097 },
    { id: 'pd-004', nom: 'Marché Yopougon', adresse: 'Yopougon, Abidjan', latitude: 5.3500, longitude: -4.0714 },
    { id: 'pd-005', nom: 'Marché Marcory', adresse: 'Marcory, Abidjan', latitude: 5.3000, longitude: -3.9917 },
  ]
  for (const p of points) await prisma.pointDistribution.upsert({ where: { id: p.id }, update: {}, create: p })
  const chemins = [
    { id: 'ch-001', departPointId: null, arriveePointId: 'pd-001', distance: 8.5 },
    { id: 'ch-002', departPointId: null, arriveePointId: 'pd-002', distance: 12.0 },
    { id: 'ch-003', departPointId: null, arriveePointId: 'pd-003', distance: 10.0 },
    { id: 'ch-004', departPointId: null, arriveePointId: 'pd-004', distance: 15.0 },
    { id: 'ch-005', departPointId: null, arriveePointId: 'pd-005', distance: 14.5 },
    { id: 'ch-006', departPointId: 'pd-001', arriveePointId: 'pd-002', distance: 7.0 },
    { id: 'ch-007', departPointId: 'pd-002', arriveePointId: 'pd-001', distance: 7.0 },
    { id: 'ch-008', departPointId: 'pd-001', arriveePointId: 'pd-004', distance: 9.0 },
    { id: 'ch-009', departPointId: 'pd-004', arriveePointId: 'pd-001', distance: 9.0 },
    { id: 'ch-010', departPointId: 'pd-002', arriveePointId: 'pd-005', distance: 6.5 },
    { id: 'ch-011', departPointId: 'pd-005', arriveePointId: 'pd-002', distance: 6.5 },
    { id: 'ch-012', departPointId: 'pd-003', arriveePointId: 'pd-005', distance: 5.0 },
    { id: 'ch-013', departPointId: 'pd-005', arriveePointId: 'pd-003', distance: 5.0 },
  ]
  for (const c of chemins) await prisma.chemin.upsert({ where: { id: c.id }, update: {}, create: c })
  const vehicules = [
    { id: 'v-001', type: TypeVehicule.MOTO, immatriculation: 'MOTO-001', capacite: 1, vitesse: 40 },
    { id: 'v-002', type: TypeVehicule.MOTO, immatriculation: 'MOTO-002', capacite: 1, vitesse: 40 },
    { id: 'v-003', type: TypeVehicule.CAMIONNETTE, immatriculation: 'CAM-001', capacite: 3, vitesse: 30 },
    { id: 'v-004', type: TypeVehicule.CAMIONNETTE, immatriculation: 'CAM-002', capacite: 3, vitesse: 30 },
    { id: 'v-005', type: TypeVehicule.CAMION, immatriculation: 'TRK-001', capacite: 6, vitesse: 25 },
  ]
  for (const v of vehicules) await prisma.vehicule.upsert({ where: { id: v.id }, update: {}, create: v })
  const produits = [
    { id: 'prod-001', nom: 'Riz local', unite: 'kg', description: 'Riz paddy local décortiqué', stockInitial: 5000, seuil: 500 },
    { id: 'prod-002', nom: 'Maïs', unite: 'kg', description: 'Maïs en grain sec', stockInitial: 3000, seuil: 300 },
    { id: 'prod-003', nom: 'Igname', unite: 'kg', description: 'Igname fraîche', stockInitial: 2000, seuil: 200 },
    { id: 'prod-004', nom: 'Manioc', unite: 'kg', description: 'Manioc entier', stockInitial: 1500, seuil: 150 },
    { id: 'prod-005', nom: 'Plantain', unite: 'régime', description: 'Régimes de banane plantain', stockInitial: 800, seuil: 80 },
    { id: 'prod-006', nom: 'Huile de palme', unite: 'litre', description: 'Huile de palme rouge brute', stockInitial: 1000, seuil: 100 },
  ]
  for (const p of produits) {
    await prisma.produit.upsert({ where: { id: p.id }, update: {}, create: { id: p.id, nom: p.nom, unite: p.unite, description: p.description } })
    const exist = await prisma.stock.findUnique({ where: { produitId: p.id } })
    if (!exist) {
      const stock = await prisma.stock.create({ data: { produitId: p.id, quantiteDisponible: p.stockInitial, seuilAlerte: p.seuil } })
      await prisma.mouvementStock.create({ data: { stockId: stock.id, type: 'ENTREE', quantite: p.stockInitial, description: 'Stock initial (seed)', versionApres: 0 } })
      console.log(`  📦 ${p.nom} — ${p.stockInitial} ${p.unite}`)
    }
  }
  console.log('\n✅ Seed terminé !')

  // ─── Comptes utilisateurs ─────────────────────────────────────────────────
  console.log('\n👤 Création des comptes utilisateurs...')
  const utilisateurs = [
    { id: 'u-001', nom: 'Administrateur', email: 'admin@vivrierpro.ci', mdp: 'Admin@2025!', role: 'ADMIN' as const },
    { id: 'u-002', nom: 'Jean Opérateur', email: 'operateur@vivrierpro.ci', mdp: 'Oper@2025!', role: 'OPERATEUR' as const },
    { id: 'u-003', nom: 'Kofi Chauffeur', email: 'chauffeur@vivrierpro.ci', mdp: 'Chauf@2025!', role: 'CHAUFFEUR' as const },
  ]
  for (const u of utilisateurs) {
    const hash = await bcrypt.hash(u.mdp, 12)
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { id: u.id, nom: u.nom, email: u.email, motDePasse: hash, role: u.role },
    })
    console.log(`  👤 ${u.role.padEnd(10)} — ${u.email}  (mdp: ${u.mdp})`)
  }
  console.log('\n✅ Utilisateurs créés !')
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
