using System;

namespace Threax.ModelGen
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine(RepoGenerator.Get("CoolNamespace", "TheBestModel"));
            Console.WriteLine(RepoInterfaceGenerator.Get("CoolNamespace", "TheBestModel"));
            Console.WriteLine(ControllerGenerator.Get("CoolNamespace", "TheBestModel"));
            Console.WriteLine(MappingGenerator.Get("CoolNamespace", "TheBestModel"));
            Console.WriteLine(RepoConfigGenerator.Get("CoolNamespace", "TheBestModel"));
            Console.ReadKey();
        }
    }
}