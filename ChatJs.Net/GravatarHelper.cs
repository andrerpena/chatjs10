using System;
using System.Security.Cryptography;
using System.Text;

namespace ChatJs.Net
{
    public class GravatarHelper
    {
        public const string Ampersand = "&";
        public const string BadgeSymbol = "&#9679;";

        public static String GetGravatarUrl(String gravatarEMailHash, Size size)
        {
            string sizeAsString;
            // this code CAN BE BETTER. I'm jot not feeling like fixing it right now
            switch (size)
            {
                case Size.s16:
                    sizeAsString = "16";
                    break;
                case Size.s24:
                    sizeAsString = "24";
                    break;
                case Size.s32:
                    sizeAsString = "32";
                    break;
                case Size.s64:
                    sizeAsString = "64";
                    break;
                case Size.s128:
                    sizeAsString = "128";
                    break;
                default:
                    throw new Exception("Size not supported");
            }

            return "https://www.gravatar.com/avatar/" + gravatarEMailHash + "?s=" + sizeAsString + GravatarHelper.Ampersand + "r=PG&d=mm";
        }

        // Create an md5 sum string of this string
        public static string GetGravatarHash(string email)
        {
            if (String.IsNullOrEmpty(email))
                email = "meu@email.com";

            // Create a new instance of the MD5CryptoServiceProvider object.
            var md5Hasher = MD5.Create();

            // Convert the input string to a byte array and compute the hash.
            byte[] data = md5Hasher.ComputeHash(Encoding.Default.GetBytes(email));

            // Create a new Stringbuilder to collect the bytes
            // and create a string.
            var sBuilder = new StringBuilder();

            // Loop through each byte of the hashed data
            // and format each one as a hexadecimal string.
            for (var i = 0; i < data.Length; i++)
                sBuilder.Append(data[i].ToString("x2"));

            return sBuilder.ToString();  // Return the hexadecimal string.
        }

        /// <summary>
        /// Gravatar image size
        /// </summary>
        public enum Size
        {
            s16,
            s24,
            s32,
            s64,
            s128
        }
    }

}
