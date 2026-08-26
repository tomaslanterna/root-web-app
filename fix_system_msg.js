const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/app/transfers/[id]/page.tsx");
let content = fs.readFileSync(filePath, "utf8");

const oldRender = `          messages.map((msg) => {
            if (msg.type === "system") {
              // Mensaje del sistema inyectado en el chat
              return (
                <div key={msg.id} className="my-6 border border-indigo-500/30 bg-indigo-500/10 rounded-xl p-4 text-center space-y-2 animate-fade-in">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-indigo-100">{msg.content}</h3>
                  <p className="text-xs text-indigo-200/70 font-medium">
                    El vendedor ha adjuntado la entrada. Root la retendrá encriptada hasta el día del evento. Podrás revelar el código QR horas antes de la fiesta.
                  </p>
                </div>
              );
            }`;

const newRender = `          messages.map((msg) => {
            if (msg.type === "system") {
              let title = "";
              let description = "";
              let iconColor = "text-indigo-400";
              let bgColor = "bg-indigo-500/10";
              let borderColor = "border-indigo-500/30";
              
              switch (msg.content) {
                case "TICKET_SENT":
                  title = "Entrada Enviada";
                  description = "El vendedor ha adjuntado la entrada. Root la retendrá encriptada hasta el día del evento. Podrás revelar el código QR horas antes de la fiesta.";
                  break;
                case "COMPLETED":
                  title = "Trato Completado";
                  description = "El comprador ha confirmado el ingreso exitoso. El dinero será liberado al vendedor. ¡Que disfruten el evento!";
                  iconColor = "text-[#D4FF00]";
                  bgColor = "bg-[#D4FF00]/10";
                  borderColor = "border-[#D4FF00]/30";
                  break;
                case "DISPUTED":
                  title = "Problema Reportado";
                  description = "Se ha reportado un problema con la entrada. El equipo de Root revisará el caso a la brevedad. Tu dinero está seguro.";
                  iconColor = "text-red-400";
                  bgColor = "bg-red-500/10";
                  borderColor = "border-red-500/30";
                  break;
                case "CANCELLED":
                  title = "Trato Cancelado";
                  description = "Este trato ha sido cancelado y los fondos serán devueltos.";
                  iconColor = "text-neutral-400";
                  bgColor = "bg-neutral-500/10";
                  borderColor = "border-neutral-500/30";
                  break;
                default:
                  title = msg.content;
                  description = "Actualización del sistema.";
              }

              return (
                <div key={msg.id} className={\`my-6 border \${borderColor} \${bgColor} rounded-xl p-4 text-center space-y-2 animate-fade-in\`}>
                  <div className={\`w-10 h-10 rounded-full flex items-center justify-center mx-auto \${iconColor} bg-white/5\`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className={\`font-bold text-sm \${iconColor}\`}>{title}</h3>
                  <p className="text-xs text-neutral-300 font-medium">
                    {description}
                  </p>
                </div>
              );
            }`;

content = content.replace(oldRender, newRender);
fs.writeFileSync(filePath, content, "utf8");
