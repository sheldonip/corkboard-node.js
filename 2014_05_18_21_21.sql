-- phpMyAdmin SQL Dump
-- version 4.0.4.1
-- http://www.phpmyadmin.net
--
-- 主機: 127.0.0.1
-- 產生日期: 2014 年 05 月 18 日 21:26
-- 伺服器版本: 5.5.32
-- PHP 版本: 5.4.19

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- 資料庫: `public_display`
--
CREATE DATABASE IF NOT EXISTS `public_display` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `public_display`;

-- --------------------------------------------------------

--
-- 表的結構 `message`
--

CREATE TABLE IF NOT EXISTS `message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `type` int(11) DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `notepaper_id` int(11) NOT NULL,
  `expire_date` datetime DEFAULT NULL,
  `update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bgcolor` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_title` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_summary` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url_thumbnail` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `img` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`user_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=3 ;

--
-- 轉存資料表中的資料 `message`
--

INSERT INTO `message` (`id`, `user_id`, `type`, `content`, `notepaper_id`, `expire_date`, `update_date`, `bgcolor`, `url`, `url_title`, `url_summary`, `url_thumbnail`, `video`, `img`) VALUES
(1, NULL, 1, 'aaabbbcccd', 1, NULL, '2014-05-18 13:19:59', '#FFFFFF', NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- 表的結構 `notepaper`
--

CREATE TABLE IF NOT EXISTS `notepaper` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `occupied` tinyint(1) NOT NULL DEFAULT '0',
  `message_id` int(11) DEFAULT NULL,
  `update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `messageId` (`message_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=9 ;

--
-- 轉存資料表中的資料 `notepaper`
--

INSERT INTO `notepaper` (`id`, `occupied`, `message_id`, `update_date`) VALUES
(1, 1, NULL, '2014-05-12 04:36:06'),
(2, 0, NULL, '2014-05-12 04:32:40'),
(3, 1, NULL, '2014-05-12 04:16:51'),
(4, 0, NULL, '2014-05-12 04:32:44'),
(5, 0, NULL, '2014-05-12 04:32:45'),
(6, 0, NULL, '2014-05-12 04:32:47'),
(7, 0, NULL, '2014-05-12 04:32:49'),
(8, 0, NULL, '2014-05-12 04:32:51');

-- --------------------------------------------------------

--
-- 表的結構 `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `salt` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` int(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=2 ;

--
-- 轉存資料表中的資料 `user`
--

INSERT INTO `user` (`id`, `username`, `password`, `salt`, `level`) VALUES
(1, 'admin', '72a76465f4a8b4ae49198ed00b45be272edf40e7', '3879823238', 3);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
