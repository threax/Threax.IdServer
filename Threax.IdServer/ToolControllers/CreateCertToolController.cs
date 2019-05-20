using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;

namespace Threax.IdServer.ToolControllers
{
    public class CreateCertToolController
    {
        public Task Run(String cn, int expirationYears, String outFile)
        {
            using (var rsa = RSA.Create()) // generate asymmetric key pair
            {
                var request = new CertificateRequest($"cn={cn}", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

                //Thanks to Muscicapa Striata for these settings at
                //https://stackoverflow.com/questions/42786986/how-to-create-a-valid-self-signed-x509certificate2-programmatically-not-loadin
                request.CertificateExtensions.Add(new X509KeyUsageExtension(X509KeyUsageFlags.DataEncipherment | X509KeyUsageFlags.KeyEncipherment | X509KeyUsageFlags.DigitalSignature, false));
                request.CertificateExtensions.Add(new X509EnhancedKeyUsageExtension(new OidCollection { new Oid("1.3.6.1.5.5.7.3.1") }, false));

                //Create the cert
                using (var cert = request.CreateSelfSigned(new DateTimeOffset(DateTime.UtcNow.AddDays(-2)), new DateTimeOffset(DateTime.UtcNow.AddYears(expirationYears))))
                {
                    using (var stream = File.Open(outFile, FileMode.Create))
                    {
                        var bytes = cert.Export(X509ContentType.Pfx);
                        stream.Write(bytes);
                    }
                }
            }

            return Task.CompletedTask;
        }
    }
}
