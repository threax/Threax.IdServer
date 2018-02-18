pushd %~dp0..
%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\ngen %1 Microsoft.EntityFrameworkCore.dll
%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\ngen %1 Microsoft.EntityFrameworkCore.Design.dll
%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\ngen %1 Microsoft.EntityFrameworkCore.Relational.Design.dll
%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\ngen %1 Microsoft.EntityFrameworkCore.Relational.dll
%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\ngen %1 Microsoft.EntityFrameworkCore.SqlServer.dll
%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\ngen %1 Microsoft.EntityFrameworkCore.SqlServer.dll
popd