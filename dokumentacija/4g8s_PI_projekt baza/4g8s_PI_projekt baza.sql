-- --------------------------------------------------------
-- Host:                         ucka.veleri.hr
-- Server version:               10.5.29-MariaDB-0+deb11u1 - Debian 11
-- Server OS:                    debian-linux-gnu
-- HeidiSQL Version:             11.3.0.6295
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table dtrbovic.PI2_proj_ARTEFAKT
CREATE TABLE IF NOT EXISTS `PI2_proj_ARTEFAKT` (
  `artefakt_sifra` int(8) NOT NULL AUTO_INCREMENT,
  `artefakt_naziv` varchar(100) NOT NULL,
  `artefakt_marka` varchar(50) DEFAULT NULL,
  `artefakt_model` varchar(100) DEFAULT NULL,
  `artefakt_datum_proizvodnje` varchar(64) DEFAULT '',
  `artefakt_dokaz_vlasnistva` varchar(500) DEFAULT NULL,
  `artefakt_stanje` varchar(256) NOT NULL,
  `artefakt_fotografija` varchar(256) DEFAULT NULL,
  `artefakt_cijena_trazena` decimal(12,2) DEFAULT NULL,
  `artefakt_cijena_rezervirana` int(16) DEFAULT NULL,
  `artefakt_odobren` enum('odobren','nije odobren') NOT NULL DEFAULT 'nije odobren',
  `artefakt_odbijen` enum('odbijen','nije odbijen') NOT NULL DEFAULT 'nije odbijen',
  `artefakt_odbijen_obrazlozenje` varchar(256) DEFAULT NULL,
  `artefakt_povucen` enum('povucen','nije povucen') NOT NULL DEFAULT 'nije povucen',
  `artefakt_prodan` enum('prodan','nije prodan') NOT NULL DEFAULT 'nije prodan',
  `artefakt_korisnik_sifra` int(8) NOT NULL,
  `artefakt_kategorija_sifra` int(8) NOT NULL,
  `artefakt_procjena_sifra` int(8) DEFAULT NULL,
  `artefakt_opis` text DEFAULT NULL,
  `artefakt_procjenitelj_sifra` int(11) DEFAULT NULL,
  `artefakt_voditelj_sifra` int(11) DEFAULT NULL,
  `artefakt_zahtjev_povlacenje` enum('da','ne') DEFAULT 'ne',
  PRIMARY KEY (`artefakt_sifra`),
  KEY `index_artefakt_naziv` (`artefakt_naziv`),
  KEY `V_PI2_proj_artefakt_korisnik_sifra` (`artefakt_korisnik_sifra`),
  KEY `V_PI2_proj_artefakt_kategorija_sifra` (`artefakt_kategorija_sifra`),
  KEY `V_PI2_proj_artefakt_procjena_sifra` (`artefakt_procjena_sifra`),
  CONSTRAINT `V_PI2_proj_artefakt_kategorija_sifra` FOREIGN KEY (`artefakt_kategorija_sifra`) REFERENCES `PI2_proj_KATEGORIJA` (`kategorija_sifra`) ON UPDATE CASCADE,
  CONSTRAINT `V_PI2_proj_artefakt_korisnik_sifra` FOREIGN KEY (`artefakt_korisnik_sifra`) REFERENCES `PI2_proj_KORISNIK` (`korisnik_sifra`) ON UPDATE CASCADE,
  CONSTRAINT `V_PI2_proj_artefakt_procjena_sifra` FOREIGN KEY (`artefakt_procjena_sifra`) REFERENCES `PI2_proj_PROCJENA` (`procjena_sifra`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table dtrbovic.PI2_proj_ARTEFAKT_FOTOGRAFIJA
CREATE TABLE IF NOT EXISTS `PI2_proj_ARTEFAKT_FOTOGRAFIJA` (
  `fotografija_sifra` int(11) NOT NULL AUTO_INCREMENT,
  `fotografija_podatak` longtext DEFAULT NULL,
  `fotografija_redni_broj` tinyint(4) NOT NULL,
  `fotografija_artefakt_sifra` int(11) NOT NULL,
  PRIMARY KEY (`fotografija_sifra`),
  KEY `fotografija_artefakt_sifra` (`fotografija_artefakt_sifra`),
  CONSTRAINT `PI2_proj_ARTEFAKT_FOTOGRAFIJA_ibfk_1` FOREIGN KEY (`fotografija_artefakt_sifra`) REFERENCES `PI2_proj_ARTEFAKT` (`artefakt_sifra`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table dtrbovic.PI2_proj_AUKCIJA
CREATE TABLE IF NOT EXISTS `PI2_proj_AUKCIJA` (
  `aukcija_sifra` int(8) NOT NULL AUTO_INCREMENT,
  `aukcija_naziv` varchar(32) NOT NULL,
  `aukcija_cijena_pocetna` decimal(12,2) DEFAULT NULL,
  `aukcija_pocetak` datetime NOT NULL,
  `aukcija_kraj` datetime NOT NULL,
  `aukcija_tip` enum('EN','NL') NOT NULL DEFAULT 'EN',
  `aukcija_status` enum('ceka','prvi poziv','drugi poziv','zadnji poziv','zavrsena') NOT NULL DEFAULT 'ceka',
  `aukcija_statusend` enum('uspjesno zavrsena','transakcija zavrsena','reklamacija','ponistena','bez ponuda') DEFAULT NULL,
  `aukcija_cijena_trenutna` decimal(12,2) DEFAULT NULL,
  `aukcija_cijena_konacna` decimal(12,2) DEFAULT NULL,
  `aukcija_ugovor` varchar(32) DEFAULT NULL,
  `aukcija_ugovor_datum` date DEFAULT NULL,
  `aukcija_ugovor_potvrdaplacanja` enum('placeno','nije placeno') DEFAULT NULL,
  `aukcija_ugovor_potvrdaisporuke` enum('isporuceno','nije isporuceno') DEFAULT NULL,
  `aukcija_ugovor_artefaktodgovara` enum('odgovara opisu','ne odgovara opisu') DEFAULT NULL,
  `aukcija_artefakt_sifra` int(8) NOT NULL,
  `aukcija_aukcijagrupa_sifra` int(8) DEFAULT NULL,
  `aukcija_korisnik_sifra` int(8) NOT NULL,
  `aukcija_recenzija_sifra` int(8) DEFAULT NULL,
  `aukcija_cijena_rezervirana` decimal(12,2) DEFAULT NULL,
  `aukcija_ugovor_kupac_prihvatio` enum('da','ne') DEFAULT 'ne',
  `aukcija_ugovor_prodavatelj_prihvatio` enum('da','ne') DEFAULT 'ne',
  `aukcija_kupac_uplatio` enum('uplatio','nije uplatio') DEFAULT 'nije uplatio',
  `aukcija_kupac_preuzeo` enum('preuzeo','nije preuzeo') DEFAULT 'nije preuzeo',
  PRIMARY KEY (`aukcija_sifra`),
  KEY `index_aukcija_naziv` (`aukcija_naziv`),
  KEY `index_aukcija_status` (`aukcija_status`),
  KEY `V_PI2_proj_aukcija_artefakt_sifra` (`aukcija_artefakt_sifra`),
  KEY `V_PI2_proj_aukcija_aukcijagrupa_sifra` (`aukcija_aukcijagrupa_sifra`),
  KEY `V_PI2_proj_aukcija_korisnik_sifra` (`aukcija_korisnik_sifra`),
  KEY `V_PI2_proj_aukcija_recenzija_sifra` (`aukcija_recenzija_sifra`),
  CONSTRAINT `V_PI2_proj_aukcija_artefakt_sifra` FOREIGN KEY (`aukcija_artefakt_sifra`) REFERENCES `PI2_proj_ARTEFAKT` (`artefakt_sifra`) ON UPDATE CASCADE,
  CONSTRAINT `V_PI2_proj_aukcija_aukcijagrupa_sifra` FOREIGN KEY (`aukcija_aukcijagrupa_sifra`) REFERENCES `PI2_proj_AUKCIJSKA_GRUPA` (`aukcijagrupa_sifra`) ON UPDATE CASCADE,
  CONSTRAINT `V_PI2_proj_aukcija_korisnik_sifra` FOREIGN KEY (`aukcija_korisnik_sifra`) REFERENCES `PI2_proj_KORISNIK` (`korisnik_sifra`) ON UPDATE CASCADE,
  CONSTRAINT `V_PI2_proj_aukcija_recenzija_sifra` FOREIGN KEY (`aukcija_recenzija_sifra`) REFERENCES `PI2_proj_RECENZIJA` (`recenzija_sifra`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table dtrbovic.PI2_proj_AUKCIJSKA_GRUPA
CREATE TABLE IF NOT EXISTS `PI2_proj_AUKCIJSKA_GRUPA` (
  `aukcijagrupa_sifra` int(8) NOT NULL AUTO_INCREMENT,
  `aukcijagrupa_datum` date NOT NULL,
  `aukcijagrupa_naziv` varchar(32) NOT NULL,
  `aukcijagrupa_opis` varchar(1000) NOT NULL,
  PRIMARY KEY (`aukcijagrupa_sifra`),
  KEY `index_aukcijagrupa_naziv` (`aukcijagrupa_naziv`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table dtrbovic.PI2_proj_KATEGORIJA
CREATE TABLE IF NOT EXISTS `PI2_proj_KATEGORIJA` (
  `kategorija_sifra` int(8) NOT NULL AUTO_INCREMENT,
  `kategorija_naziv` varchar(32) NOT NULL,
  `kategorija_opis` varchar(1000) NOT NULL,
  PRIMARY KEY (`kategorija_sifra`),
  KEY `index_kategorija_naziv` (`kategorija_naziv`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table dtrbovic.PI2_proj_KORISNIK
CREATE TABLE IF NOT EXISTS `PI2_proj_KORISNIK` (
  `korisnik_sifra` int(8) NOT NULL AUTO_INCREMENT,
  `korisnik_ime` varchar(32) NOT NULL,
  `korisnik_prezime` varchar(32) NOT NULL,
  `korisnik_OIB` varchar(15) DEFAULT NULL,
  `korisnik_uloga` enum('admin','prodavatelj','ponuditelj','procjenitelj','voditelj') NOT NULL,
  `korisnik_username` varchar(16) NOT NULL,
  `korisnik_pass` varchar(256) NOT NULL,
  `korisnik_IBAN` varchar(34) DEFAULT NULL,
  `korisnik_adresa` varchar(64) DEFAULT NULL,
  `korisnik_email` varchar(64) NOT NULL,
  `korisnik_mob` varchar(20) DEFAULT NULL,
  `korisnik_status` enum('aktivan','neaktivan','blokiran') NOT NULL,
  `korisnik_uvj_koristenja_sifra` int(8) DEFAULT NULL,
  `korisnik_kupac` enum('da','ne') NOT NULL DEFAULT 'ne',
  `korisnik_prodavatelj` enum('da','ne') NOT NULL DEFAULT 'ne',
  `korisnik_procjenitelj` enum('da','ne') NOT NULL DEFAULT 'ne',
  `korisnik_voditelj` enum('da','ne') NOT NULL DEFAULT 'ne',
  `korisnik_admin` enum('da','ne') NOT NULL DEFAULT 'ne',
  `korisnik_superadmin` enum('da','ne') NOT NULL DEFAULT 'ne',
  `korisnik_verificiran` enum('da','ne') NOT NULL DEFAULT 'ne',
  PRIMARY KEY (`korisnik_sifra`),
  KEY `index_korisnik_OIB` (`korisnik_OIB`),
  KEY `index_korisnik_username` (`korisnik_username`),
  KEY `V_PI2_proj_korisnik_uvj_koristenja_sifra` (`korisnik_uvj_koristenja_sifra`),
  CONSTRAINT `V_PI2_proj_korisnik_uvj_koristenja_sifra` FOREIGN KEY (`korisnik_uvj_koristenja_sifra`) REFERENCES `PI2_proj_UVJETI_KORISTENJA` (`uvj_koristenja_sifra`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table dtrbovic.PI2_proj_OBAVIJEST
CREATE TABLE IF NOT EXISTS `PI2_proj_OBAVIJEST` (
  `obavijest_sifra` int(11) NOT NULL AUTO_INCREMENT,
  `obavijest_vrijeme` datetime NOT NULL,
  `obavijest_naslov` varchar(100) NOT NULL,
  `obavijest_tekst` text NOT NULL,
  `obavijest_procitana` enum('da','ne') DEFAULT 'ne',
  `obavijest_korisnik_sifra` int(11) NOT NULL,
  `obavijest_aukcija_sifra` int(11) DEFAULT NULL,
  PRIMARY KEY (`obavijest_sifra`),
  KEY `obavijest_korisnik_sifra` (`obavijest_korisnik_sifra`),
  CONSTRAINT `PI2_proj_OBAVIJEST_ibfk_1` FOREIGN KEY (`obavijest_korisnik_sifra`) REFERENCES `PI2_proj_KORISNIK` (`korisnik_sifra`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table dtrbovic.PI2_proj_PONUDA
CREATE TABLE IF NOT EXISTS `PI2_proj_PONUDA` (
  `ponuda_sifra` int(8) NOT NULL AUTO_INCREMENT,
  `ponuda_rednibroj` varchar(32) NOT NULL,
  `ponuda_vrijeme` datetime NOT NULL,
  `ponuda_cijena_ponudjena` decimal(12,2) DEFAULT NULL,
  `ponuda_cijena_autobid_max` decimal(12,2) DEFAULT NULL,
  `ponuda_cijena_autobid_step` decimal(12,2) DEFAULT NULL,
  `ponuda_cijena_autobid_time` enum('odmah','nakon prvog poziva','nakon drugog poziva','nakon zadnjeg poziva') DEFAULT NULL,
  `ponuda_korisnik_sifra` int(8) NOT NULL,
  `ponuda_aukcija_sifra` int(8) NOT NULL,
  PRIMARY KEY (`ponuda_sifra`),
  KEY `V_PI2_proj_ponuda_korisnik_sifra` (`ponuda_korisnik_sifra`),
  KEY `V_PI2_proj_ponuda_aukcija_sifra` (`ponuda_aukcija_sifra`),
  CONSTRAINT `V_PI2_proj_ponuda_aukcija_sifra` FOREIGN KEY (`ponuda_aukcija_sifra`) REFERENCES `PI2_proj_AUKCIJA` (`aukcija_sifra`) ON UPDATE CASCADE,
  CONSTRAINT `V_PI2_proj_ponuda_korisnik_sifra` FOREIGN KEY (`ponuda_korisnik_sifra`) REFERENCES `PI2_proj_KORISNIK` (`korisnik_sifra`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table dtrbovic.PI2_proj_PROCJENA
CREATE TABLE IF NOT EXISTS `PI2_proj_PROCJENA` (
  `procjena_sifra` int(8) NOT NULL AUTO_INCREMENT,
  `procjena_opis` varchar(1000) NOT NULL,
  `procjena_fotografija` varchar(256) DEFAULT NULL,
  `procjena_dodatni_dokazi` varchar(256) DEFAULT NULL,
  `procjena_cijena_procijenjena` decimal(12,2) DEFAULT NULL,
  `procjena_korisnik_sifra` int(8) NOT NULL,
  `procjena_preporuka` enum('odobriti','odbiti') DEFAULT NULL,
  `procjena_datum` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`procjena_sifra`),
  KEY `V_PI2_procjena_korisnik_sifra` (`procjena_korisnik_sifra`),
  CONSTRAINT `V_PI2_procjena_korisnik_sifra` FOREIGN KEY (`procjena_korisnik_sifra`) REFERENCES `PI2_proj_KORISNIK` (`korisnik_sifra`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table dtrbovic.PI2_proj_RECENZIJA
CREATE TABLE IF NOT EXISTS `PI2_proj_RECENZIJA` (
  `recenzija_sifra` int(8) NOT NULL AUTO_INCREMENT,
  `recenzija_ocjena` int(1) NOT NULL,
  `recenzija_komentar` varchar(256) DEFAULT NULL,
  `recenzija_korisnik_sifra` int(8) NOT NULL,
  `recenzija_aukcija_sifra` int(8) DEFAULT NULL,
  `recenzija_davatelj_sifra` int(8) DEFAULT NULL,
  `recenzija_primatelj_sifra` int(8) DEFAULT NULL,
  `recenzija_datum` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`recenzija_sifra`),
  KEY `index_recenzija_ocjena` (`recenzija_ocjena`),
  KEY `V_PI2_proj_recenzija_korisnik_sifra` (`recenzija_korisnik_sifra`),
  CONSTRAINT `V_PI2_proj_recenzija_korisnik_sifra` FOREIGN KEY (`recenzija_korisnik_sifra`) REFERENCES `PI2_proj_KORISNIK` (`korisnik_sifra`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table dtrbovic.PI2_proj_RECENZIJA_SUSTAVA
CREATE TABLE IF NOT EXISTS `PI2_proj_RECENZIJA_SUSTAVA` (
  `recenzija_sustava_sifra` int(11) NOT NULL AUTO_INCREMENT,
  `recenzija_sustava_ocjena` int(11) NOT NULL,
  `recenzija_sustava_komentar` text DEFAULT NULL,
  `recenzija_sustava_datum` datetime DEFAULT current_timestamp(),
  `recenzija_sustava_korisnik_sifra` int(11) NOT NULL,
  `recenzija_sustava_aukcija_sifra` int(11) DEFAULT NULL,
  PRIMARY KEY (`recenzija_sustava_sifra`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

-- Dumping structure for table dtrbovic.PI2_proj_UVJETI_KORISTENJA
CREATE TABLE IF NOT EXISTS `PI2_proj_UVJETI_KORISTENJA` (
  `uvj_koristenja_sifra` int(8) NOT NULL AUTO_INCREMENT,
  `uvj_koristenja_verzija` varchar(8) NOT NULL,
  `uvj_koristenja_tekst` varchar(1000) NOT NULL,
  PRIMARY KEY (`uvj_koristenja_sifra`),
  KEY `index_koristenja_verzija` (`uvj_koristenja_verzija`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data exporting was unselected.

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
